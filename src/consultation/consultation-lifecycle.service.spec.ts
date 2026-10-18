import { ConflictException, ForbiddenException } from '@nestjs/common';
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

const save = jest.fn((value: Consultation) => value);
const repo = {
  save,
  manager: {
    transaction: jest.fn((work: (m: unknown) => unknown) => work({ save })),
  },
};
const consultations = { findEditable: jest.fn(), findOne: jest.fn() };
const queueEntries = {
  routeFromDoctor: jest.fn(),
  completeCurrentFor: jest.fn(),
};
const doctor = { id: 'd1', role: UserRole.DOCTOR };

const consultation = (status: ConsultationStatus) =>
  ({
    id: 'c1',
    doctorId: 'd1',
    status,
    notes: 'Clinical notes',
  }) as Consultation;

describe('ConsultationLifecycleService', () => {
  let service: ConsultationLifecycleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationLifecycleService,
        { provide: getRepositoryToken(Consultation), useValue: repo },
        { provide: ConsultationService, useValue: consultations },
        { provide: QueueEntriesService, useValue: queueEntries },
        { provide: AdmissionsService, useValue: { admit: jest.fn() } },
      ],
    }).compile();
    service = module.get(ConsultationLifecycleService);
  });

  it('refuses clinical routing from anyone but a doctor', async () => {
    // Arrange
    const dto = { nextIntents: [VisitIntenentsEnum.LAB] };

    // Act
    const act = service.complete('c1', dto, { id: 'n1', role: UserRole.NURSE });

    // Assert
    await expect(act).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps the hand-off note apart from the clinical notes', async () => {
    // Arrange
    const open = consultation(ConsultationStatus.IN_PROGRESS);
    consultations.findEditable.mockResolvedValue(open);

    // Act
    await service.complete('c1', { notes: ' Review in a week ' }, doctor);

    // Assert
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ConsultationStatus.COMPLETED,
        notes: 'Clinical notes',
        completionNotes: 'Review in a week',
      }),
    );
  });

  it('refuses to sign an already signed consultation again', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(
      consultation(ConsultationStatus.COMPLETED),
    );

    // Act
    const act = service.complete('c1', {}, doctor);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(queueEntries.routeFromDoctor).not.toHaveBeenCalled();
  });

  it('refuses to cancel a signed consultation', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(
      consultation(ConsultationStatus.COMPLETED),
    );

    // Act
    const act = service.cancel('c1', doctor, 'Wrong patient');

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('records the cancel reason without touching the notes', async () => {
    // Arrange
    consultations.findEditable.mockResolvedValue(
      consultation(ConsultationStatus.IN_PROGRESS),
    );

    // Act
    await service.cancel('c1', doctor, 'Patient left');

    // Assert
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ConsultationStatus.CANCELLED,
        notes: 'Clinical notes',
        cancellationReason: 'Patient left',
      }),
    );
  });
});
