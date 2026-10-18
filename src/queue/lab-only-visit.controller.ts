import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { CreateLabOnlyVisitDTO } from './dto/create-lab-only-visit.dto';
import { LabOnlyVisitsService } from './lab-only-visits.service';

@Controller('visits/lab-only')
export class LabOnlyVisitController {
  constructor(private readonly labOnlyVisits: LabOnlyVisitsService) {}

  /** Sends a walk-in straight to the lab; returns the patient's active visit if they already have one. */
  @Post()
  @Roles(RoleGroups.LAB_INTAKE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateLabOnlyVisitDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(
      await this.labOnlyVisits.checkIn(body.patientId, user.id),
    );
  }
}
