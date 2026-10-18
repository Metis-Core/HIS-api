import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { DoctorAssignmentService } from './doctor-assignment.service';
import { DoctorDirectoryService } from './doctor-directory.service';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { ReassignVisitDto } from './dto/reassign-visit.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly directory: DoctorDirectoryService,
    private readonly assignment: DoctorAssignmentService,
  ) {}

  @Get()
  @Roles(RoleGroups.FLOOR_STAFF)
  async list(@Query() query: QueryDoctorsDto) {
    return formatResponse(await this.directory.search(query));
  }

  @Put('visits/:visitId')
  @Roles(RoleGroups.RECEPTION)
  async reassign(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body() dto: ReassignVisitDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(
      await this.assignment.assignManually(visitId, dto, user.id),
    );
  }

  @Post('visits/:visitId/auto')
  @Roles(RoleGroups.RECEPTION)
  @HttpCode(HttpStatus.OK)
  async autoAssign(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return formatResponse(await this.assignment.rebalance(visitId));
  }
}
