import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { ClinicRecordsService } from './clinic-records.service';
import { ClinicRecord } from './entities/clinic-record.entity';
import { ClinicRecordKind } from './enums/clinic-record-kind.enum';
import { ClinicRecordCreatedEvent } from './events/clinic-record-created.event';

const records = {
  create: jest.fn((value: object) => value),
  save: jest.fn((value: object) => Promise.resolve({ id: 'r1', ...value })),
};
const patients = { findOneBy: jest.fn() };
const visits = { existsBy: jest.fn() };
const events = { emit: jest.fn() };

const immunization = {
  vaccine: 'BCG',
  dose: 'Birth dose',
  batch_number: 'B123',
  expiry_date: '2027-01-01',
  route: 'Intradermal',
  site: 'Right upper arm',
};

describe('ClinicRecordsService', () => {
  let service: ClinicRecordsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    patients.findOneBy.mockResolvedValue({
      id: 'p1',
      gender: 'female',
      dateOfBirth: '1995-01-01',
    });
    visits.existsBy.mockResolvedValue(true);
    const module = await Test.createTestingModule({
      providers: [
        ClinicRecordsService,
        { provide: getRepositoryToken(ClinicRecord), useValue: records },
        { provide: getRepositoryToken(Patient), useValue: patients },
        { provide: getRepositoryToken(Visit), useValue: visits },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();
    service = module.get(ClinicRecordsService);
  });

  it('saves an immunization and announces it, without a charge code for a national vaccine', async () => {
    // Act
    await service.create(
      {
        patientId: 'p1',
        visitId: 'v1',
        kind: ClinicRecordKind.IMMUNIZATION,
        data: immunization,
      },
      'n1',
    );

    // Assert
    expect(events.emit).toHaveBeenCalledWith(
      ClinicRecordCreatedEvent.channel,
      expect.objectContaining({
        kind: ClinicRecordKind.IMMUNIZATION,
        vaccineServiceCode: null,
      }),
    );
  });

  it('carries the service code of a private vaccine so it can be billed', async () => {
    // Act
    await service.create(
      {
        patientId: 'p1',
        visitId: 'v1',
        kind: ClinicRecordKind.IMMUNIZATION,
        data: {
          ...immunization,
          vaccine: 'Typhoid conjugate',
          dose: 'Dose 1',
          route: 'Intramuscular',
          site: 'Left upper arm',
        },
      },
      'n1',
    );

    // Assert
    expect(events.emit).toHaveBeenCalledWith(
      ClinicRecordCreatedEvent.channel,
      expect.objectContaining({ vaccineServiceCode: 'VAC_TYPHOID' }),
    );
  });

  it('flags danger signs and a raised blood pressure on an antenatal visit', async () => {
    // Act
    const saved = await service.create(
      {
        patientId: 'p1',
        kind: ClinicRecordKind.ANTENATAL_VISIT,
        data: {
          contact: '3',
          gestation_weeks: 28,
          bp_systolic: 165,
          bp_diastolic: 100,
          danger_signs: 'Severe headache or blurred vision',
          risk: 'High risk, refer',
        },
      },
      'n1',
    );

    // Assert
    expect(saved.flags).toMatchObject({
      bp_systolic: 'critical_high',
      bp_diastolic: 'high',
      danger_signs: 'abnormal',
      risk: 'abnormal',
    });
  });

  it('refuses a record with a required field missing', async () => {
    // Act
    const act = service.create(
      {
        patientId: 'p1',
        kind: ClinicRecordKind.IMMUNIZATION,
        data: { vaccine: 'BCG' },
      },
      'n1',
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses an unknown patient and a visit that belongs to someone else', async () => {
    // Arrange
    patients.findOneBy.mockResolvedValueOnce(null);

    // Act and assert
    await expect(
      service.create(
        {
          patientId: 'x',
          kind: ClinicRecordKind.IMMUNIZATION,
          data: immunization,
        },
        'n1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    visits.existsBy.mockResolvedValue(false);
    await expect(
      service.create(
        {
          patientId: 'p1',
          visitId: 'v9',
          kind: ClinicRecordKind.IMMUNIZATION,
          data: immunization,
        },
        'n1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
