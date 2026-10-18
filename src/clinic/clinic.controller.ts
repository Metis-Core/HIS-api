import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { ClinicRecordsService } from './clinic-records.service';
import { CreateClinicRecordDto } from './dto/create-clinic-record.dto';
import { QueryClinicRecordsDto } from './dto/query-clinic-records.dto';
import { CLINIC_TEMPLATES } from './templates';
import { NATIONAL_VACCINES, VACCINES } from './vaccines';

@Controller('clinic')
export class ClinicController {
  constructor(private readonly records: ClinicRecordsService) {}

  /** The forms and the vaccine list the clinic screens are built from. */
  @Get('templates')
  @Roles(RoleGroups.CLINICAL_STAFF)
  templates() {
    return formatResponse({
      templates: CLINIC_TEMPLATES,
      vaccines: VACCINES,
      national: NATIONAL_VACCINES.map((vaccine) => vaccine.name),
    });
  }

  @Post('records')
  @Roles(RoleGroups.CLINICAL_STAFF)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateClinicRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.records.create(dto, user.id));
  }

  @Get('records')
  @Roles(RoleGroups.CLINICAL_STAFF)
  async list(@Query() query: QueryClinicRecordsDto) {
    return formatResponse(await this.records.list(query));
  }
}
