import { Controller, Get, Query } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { formatResponse } from 'common/response-format';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDTO } from './dto/audit-log-query.dto';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(RoleGroups.ADMINS)
  async search(@Query() query: AuditLogQueryDTO) {
    return formatResponse(await this.auditLogsService.search(query));
  }
}
