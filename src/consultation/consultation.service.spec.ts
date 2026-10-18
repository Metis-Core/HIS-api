import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationService } from './consultation.service';

describe('ConsultationService', () => {
  let service: ConsultationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultationService],
    })
      // Scaffold smoke test: stub every injected dependency.
      .useMocker(() => ({}))
      .compile();

    service = module.get<ConsultationService>(ConsultationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
