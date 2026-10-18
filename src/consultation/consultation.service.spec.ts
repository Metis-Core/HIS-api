import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'common/enums/userRoles.enum';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { ConsultationService } from './consultation.service';

describe('ConsultationService', () => {
  let service: ConsultationService;

  beforeEach(async () => {
    jest.clearAllMocks();
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

  it('refuses clinical routing from anyone but a doctor', async () => {
    // Arrange
    const dto = { nextIntents: [VisitIntenentsEnum.LAB] };

    // Act
    const act = service.complete('c1', dto, UserRole.NURSE);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ForbiddenException);
  });
});
