import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { Department } from 'common/enums/department.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { CheckInVisitDto } from './dto/check-in-visit.dto';
import { CompleteQueueStageDto } from './dto/complete-queue-stage.dto';
import { QueryQueueDto } from './dto/query-queue.dto';
import { TransferQueueEntryDto } from './dto/transfer-queue-entry.dto';
import { UpdateVisitPriorityDto } from './dto/update-visit-priority.dto';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { QueueService } from './queue.service';

@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('check-in')
  @Roles(RoleGroups.CHECK_IN_STAFF)
  @HttpCode(HttpStatus.CREATED)
  checkIn(
    @Body() dto: CheckInVisitDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueService.checkIn(dto, user.id);
  }

  @Get()
  @Roles(RoleGroups.FLOOR_STAFF)
  findAll(@Query() query: QueryQueueDto) {
    return this.queueService.findQueueEntries(query);
  }

  @Get('department/:department')
  @Roles(RoleGroups.FLOOR_STAFF)
  getDepartmentQueue(
    @Param('department', new ParseEnumPipe(Department)) department: Department,
    @Query('status') status?: QueueEntryStatus,
  ) {
    return this.queueService.getDepartmentQueue(
      department,
      status ?? QueueEntryStatus.WAITING,
    );
  }

  @Get('display/:department')
  @Roles(RoleGroups.FLOOR_STAFF)
  getDisplayBoard(
    @Param('department', new ParseEnumPipe(Department)) department: Department,
  ) {
    return this.queueService.getDisplayBoard(department);
  }

  @Get('visits/:id')
  @Roles(RoleGroups.FLOOR_STAFF)
  findVisit(@Param('id', ParseUUIDPipe) id: string) {
    return this.queueService.findVisit(id);
  }

  @Get('entries/:id')
  @Roles(RoleGroups.FLOOR_STAFF)
  findEntry(@Param('id', ParseUUIDPipe) id: string) {
    return this.queueService.findQueueEntry(id);
  }

  @Post('department/:department/call-next')
  @Roles(RoleGroups.FLOOR_STAFF)
  callNext(
    @Param('department', new ParseEnumPipe(Department)) department: Department,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueService.callNext(department, user.id);
  }

  @Post('entries/:id/start')
  @Roles(RoleGroups.FLOOR_STAFF)
  startService(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueService.startService(id, user.id);
  }

  @Post('entries/:id/complete')
  @Roles(RoleGroups.FLOOR_STAFF)
  completeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteQueueStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueService.completeStage(id, dto, user.id);
  }

  @Post('entries/:id/skip')
  @Roles(RoleGroups.FLOOR_STAFF)
  skip(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ) {
    return this.queueService.skip(id, notes);
  }

  @Post('entries/:id/transfer')
  @Roles(RoleGroups.FLOOR_STAFF)
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferQueueEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueService.transfer(id, dto, user.id);
  }

  @Patch('visits/:id/priority')
  @Roles(RoleGroups.PRIORITY_MANAGERS)
  updatePriority(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitPriorityDto,
  ) {
    return this.queueService.updatePriority(id, dto.priority);
  }

  @Delete('visits/:id')
  @Roles(RoleGroups.RECEPTION)
  cancelVisit(@Param('id', ParseUUIDPipe) id: string) {
    return this.queueService.cancelVisit(id);
  }
}
