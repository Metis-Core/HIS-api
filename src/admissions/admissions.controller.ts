import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { AdmissionsService } from './admissions.service';
import { DischargePatientDTO } from './dto/discharge-patient.dto';
import { QueryAdmissionsDTO } from './dto/query-admissions.dto';

@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF)
  list(@Query() query: QueryAdmissionsDTO) {
    return this.admissions.list(query);
  }

  @Post(':id/discharge')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleGroups.PROVIDERS)
  async discharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DischargePatientDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.admissions.discharge(id, dto, user.id));
  }
}
