import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, IsNull } from 'typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { PatientType } from 'src/patients/enums/patient-type.enum';
import { AdmissionsService } from './admissions.service';
import { Admission } from './entities/admission.entity';

const manager = {
  existsBy: jest.fn(),
  findOneByOrFail: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  save: jest.fn((value: unknown) => value),
  create: jest.fn((_target: unknown, value: object) => value),
};
const repo = {
  findAndCount: jest.fn(),
  manager: {
    transaction: jest.fn((work: (m: typeof manager) => unknown) =>
      work(manager),
    ),
  },
};
const dto = { ward: 'Paediatric', reason: 'Dehydration' };
const context = {
  patientId: 'p1',
  visitId: 'v1',
  consultationId: 'c1',
  admittedById: 'd1',
};

describe('AdmissionsService', () => {
  let service: AdmissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionsService,
        { provide: getRepositoryToken(Admission), useValue: repo },
      ],
    }).compile();
    service = module.get(AdmissionsService);
  });

  it('marks the patient as an inpatient through an audited save', async () => {
    // Arrange
    const patient = { id: 'p1', type: PatientType.OUTPATIENT } as Patient;
    manager.existsBy.mockResolvedValue(false);
    manager.findOneByOrFail.mockResolvedValue(patient);

    // Act
    const saved = await service.admit(
      manager as unknown as EntityManager,
      dto,
      context,
    );

    // Assert
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', type: PatientType.INPATIENT }),
    );
    expect(saved).toMatchObject({ ...context, ...dto });
    expect(saved.admittedAt).toBeInstanceOf(Date);
  });

  it('refuses a second admission for the same visit', async () => {
    // Arrange
    manager.existsBy.mockResolvedValue(true);

    // Act
    const act = service.admit(
      manager as unknown as EntityManager,
      dto,
      context,
    );

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('lists admissions newest first in pages', async () => {
    // Arrange
    repo.findAndCount.mockResolvedValue([[], 0]);

    // Act
    await service.list({ patientId: 'p1', page: 2, limit: 10 });

    // Assert
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: 'p1' },
        order: { admittedAt: 'DESC', id: 'DESC' },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('discharges a stay and returns the patient to outpatient', async () => {
    // Arrange
    manager.findOneBy.mockResolvedValue({ id: 'a1', patientId: 'p1' });

    // Act
    const saved = await service.discharge('a1', { notes: 'Well' }, 'd1');

    // Assert
    expect(manager.update).toHaveBeenCalledWith(Patient, 'p1', {
      type: PatientType.OUTPATIENT,
    });
    expect(saved).toMatchObject({
      dischargedById: 'd1',
      dischargeNotes: 'Well',
    });
    expect(saved.dischargedAt).toBeInstanceOf(Date);
  });

  it('refuses to discharge twice', async () => {
    // Arrange
    manager.findOneBy.mockResolvedValue({
      id: 'a1',
      patientId: 'p1',
      dischargedAt: new Date(),
    });

    // Act
    const act = service.discharge('a1', {}, 'd1');

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('reports a missing admission', async () => {
    // Arrange
    manager.findOneBy.mockResolvedValue(null);

    // Act
    const act = service.discharge('nope', {}, 'd1');

    // Assert
    await expect(act).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters by whether the stay has ended', async () => {
    // Arrange
    repo.findAndCount.mockResolvedValue([[], 0]);

    // Act
    await service.list({ discharged: false, page: 1, limit: 10 });

    // Assert
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dischargedAt: IsNull() } }),
    );
  });
});
