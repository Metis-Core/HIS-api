import { Test, TestingModule } from '@nestjs/testing';
import { AuditlogsController } from './auditlogs.controller';
import { AuditlogsService } from './auditlogs.service';

describe('AuditlogsController', () => {
  let controller: AuditlogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditlogsController],
      providers: [AuditlogsService],
    }).compile();

    controller = module.get<AuditlogsController>(AuditlogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
