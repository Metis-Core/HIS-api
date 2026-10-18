import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { CreateServiceVisitDTO } from './dto/create-service-visit.dto';
import { ServiceVisitsService } from './service-visits.service';

@Controller('visits/service')
export class ServiceVisitController {
  constructor(private readonly serviceVisits: ServiceVisitsService) {}

  /** Checks a patient in for antenatal care or immunization without a consultation. */
  @Post()
  @Roles(RoleGroups.CHECK_IN_STAFF)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateServiceVisitDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(
      await this.serviceVisits.checkIn(body.patientId, body.service, user.id),
    );
  }
}
