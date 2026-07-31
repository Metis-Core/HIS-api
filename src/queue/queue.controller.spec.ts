import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

describe('QueueController', () => {
  let controller: QueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: {
            checkIn: jest.fn(),
            findQueueEntries: jest.fn(),
            getDepartmentQueue: jest.fn(),
            getDisplayBoard: jest.fn(),
            findVisit: jest.fn(),
            findQueueEntry: jest.fn(),
            callNext: jest.fn(),
            startService: jest.fn(),
            completeStage: jest.fn(),
            skip: jest.fn(),
            updatePriority: jest.fn(),
            cancelVisit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
