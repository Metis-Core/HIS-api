import { Test, TestingModule } from '@nestjs/testing';
import { TraigeController } from './traige.controller';
import { TraigeService } from './traige.service';

describe('TraigeController', () => {
  let controller: TraigeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TraigeController],
      providers: [
        {
          provide: TraigeService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByPatient: jest.fn(),
            findQueue: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TraigeController>(TraigeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
