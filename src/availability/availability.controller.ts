import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { AvailabilityPeriodsService } from './availability-periods.service';
import { QueryStaffAvailabilityDto } from './dto/query-staff-availability.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { StaffAvailabilityService } from './staff-availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly periods: AvailabilityPeriodsService,
    private readonly staff: StaffAvailabilityService,
  ) {}

  @Get('staff')
  @Roles(RoleGroups.FLOOR_STAFF)
  async listStaff(
    @Query() query: QueryStaffAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const everyone =
      query.includeInactive === true &&
      RoleGroups.ADMINS.roles.includes(user.role);
    return formatResponse(await this.staff.search(query, everyone));
  }

  @Get('me')
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return formatResponse(await this.periods.overview(user.id));
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  async setMine(
    @Body() dto: SetAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.periods.set(user.id, dto, user.id));
  }

  @Delete('me/:periodId')
  async cancelMine(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.periods.cancel(user.id, periodId));
  }

  @Get('users/:userId')
  @Roles(RoleGroups.ADMINS)
  async forUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return formatResponse(await this.periods.overview(userId));
  }

  @Post('users/:userId')
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.OK)
  async setForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetAvailabilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return formatResponse(await this.periods.set(userId, dto, actor.id));
  }

  @Delete('users/:userId/:periodId')
  @Roles(RoleGroups.ADMINS)
  async cancelForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return formatResponse(await this.periods.cancel(userId, periodId));
  }
}
