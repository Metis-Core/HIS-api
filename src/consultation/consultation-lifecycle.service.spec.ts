import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from 'common/enums/userRoles.enum';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';
import { ConsultationLifecycleService } from './consultation-lifecycle.service';

describe('ConsultationLifecycleService', () => {
  let service: ConsultationLifecycleService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultationLifecycleService],
    })
      .useMocker(() => ({}))
      .compile();
    service = module.get(ConsultationLifecycleService);
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
