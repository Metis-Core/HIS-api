import { Controller, Get, Query } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { AdmissionsService } from './admissions.service';
import { QueryAdmissionsDTO } from './dto/query-admissions.dto';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF)
  list(@Query() query: QueryAdmissionsDTO) {
    return this.admissions.list(query);
  }
}
