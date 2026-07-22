import { Test, TestingModule } from '@nestjs/testing';
import { TraigeService } from './traige.service';

describe('TraigeService', () => {
  let service: TraigeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TraigeService],
    }).compile();

    service = module.get<TraigeService>(TraigeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
