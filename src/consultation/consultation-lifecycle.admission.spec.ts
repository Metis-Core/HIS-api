import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { AdmissionsService } from 'src/admissions/admissions.service';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { ConsultationLifecycleService } from './consultation-lifecycle.service';
import { ConsultationService } from './consultation.service';
import { Consultation } from './entities/consultation.entity';
import { ConsultationStatus } from './enums/consultation-status.enum';

const manager = { save: jest.fn((value: unknown) => value) };
const repo = {
  manager: {
    transaction: jest.fn((work: (m: typeof manager) => unknown) =>
      work(manager),
    ),
  },
};
const consultations = { findEditable: jest.fn(), findOne: jest.fn() };
const queueEntries = {
  routeFromDoctor: jest.fn(),
  completeCurrentFor: jest.fn(),
};
const admissions = { admit: jest.fn() };
const doctor = { id: 'd1', role: UserRole.DOCTOR };
const admission = { ward: 'Female medical', reason: 'Severe malaria' };

describe('ConsultationLifecycleService admission (D6)', () => {
  let service: ConsultationLifecycleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    consultations.findEditable.mockResolvedValue({
      id: 'c1',
      patientId: 'p1',
      visitId: 'v1',
      doctorId: 'd1',
      status: ConsultationStatus.IN_PROGRESS,
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationLifecycleService,
        { provide: getRepositoryToken(Consultation), useValue: repo },
        { provide: ConsultationService, useValue: consultations },
        { provide: QueueEntriesService, useValue: queueEntries },
        { provide: AdmissionsService, useValue: admissions },
      ],
    }).compile();
    service = module.get(ConsultationLifecycleService);
  });

  it('admits in the same transaction that signs the consultation', async () => {
    // Arrange
    const dto = { admission, nextIntents: [VisitIntenentsEnum.LAB] };

    // Act
    await service.complete('c1', dto, doctor);

    // Assert
    expect(admissions.admit).toHaveBeenCalledWith(manager, admission, {
      patientId: 'p1',
      visitId: 'v1',
      consultationId: 'c1',
      admittedById: 'd1',
    });
    expect(queueEntries.routeFromDoctor).toHaveBeenCalledWith(
      'v1',
      [VisitIntenentsEnum.LAB, VisitIntenentsEnum.ADMISSION],
      undefined,
    );
  });

  it('only lets a doctor admit', async () => {
    // Arrange
    const nurse = { id: 'n1', role: UserRole.NURSE };

    // Act
    const act = service.complete('c1', { admission }, nurse);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ForbiddenException);
    expect(admissions.admit).not.toHaveBeenCalled();
  });

  it('refuses the ward stage without an admission record', async () => {
    // Arrange
    const dto = { nextIntents: [VisitIntenentsEnum.ADMISSION] };

    // Act
    const act = service.complete('c1', dto, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not admit when signing without an admission', async () => {
    // Arrange / Act
    await service.complete('c1', {}, doctor);

    // Assert
    expect(admissions.admit).not.toHaveBeenCalled();
    expect(queueEntries.routeFromDoctor).toHaveBeenCalledWith(
      'v1',
      [],
      undefined,
    );
  });
});
