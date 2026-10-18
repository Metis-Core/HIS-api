import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { QueueEntriesService } from 'src/queue/queue-entries.service';
import { UsersService } from 'src/users/users.service';
import { VisitsService } from 'src/queue/visit.service';
import { TriageCategory } from 'src/queue/enums/triage-category.enum';
import { TriageAcuity } from './enums/triage-acuity.enum';
import { TriageStatus } from './enums/triage-status.enum';
import { Triage } from './entities/traige.entity';
import { TraigeService } from './traige.service';

describe('TraigeService', () => {
  let service: TraigeService;
  const repository = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const visits = { raiseCategory: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraigeService,
        {
          provide: getRepositoryToken(Triage),
          useValue: repository,
        },
        { provide: VisitsService, useValue: visits },
        {
          provide: PatientsService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: QueueEntriesService,
          useValue: {
            ensureIntent: jest.fn(),
            completeCurrentFor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TraigeService>(TraigeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('raises the visit to red when triage records a level 2 acuity', async () => {
    // Arrange
    repository.save.mockResolvedValue({ id: 't1' });
    repository.findOne.mockResolvedValue({
      id: 't1',
      acuity: TriageAcuity.LEVEL_2,
      status: TriageStatus.WAITING,
    });

    // Act
    await service.createTriage(
      {
        patientId: 'p1',
        visitId: 'v1',
        acuity: TriageAcuity.LEVEL_2,
        chiefComplaint: 'Chest pain',
      },
      'nurse-1',
    );

    // Assert
    expect(visits.raiseCategory).toHaveBeenCalledWith('v1', TriageCategory.RED);
  });
});
