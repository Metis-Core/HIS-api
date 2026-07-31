import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getRepositoryToken(Visit),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QueueEntry),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: PatientsService,
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
