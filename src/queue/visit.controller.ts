import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { Department } from 'common/enums/department.enum';
import { QueueEntriesService } from './queue-entries.service';
import { VisitsService } from './visit.service';
import { formatResponse } from '../../common/response-format';
import { CreateVisitDTO } from './dto/create-visit.dto';
import { UpdateVisitDTO } from './dto/update-visit.dto';

@Controller('visits')
export class VisitController {
  constructor(
    private readonly visitService: VisitsService,
    private readonly queueEntries: QueueEntriesService,
  ) {}

  @Get()
  @Roles(RoleGroups.FLOOR_STAFF)
  async getAllVisits() {
    const visits = await this.visitService.findManyWithPagination({
      relations: { queueEntries: true },
    });
    return formatResponse(visits);
  }

  @Get('/queues')
  @Roles(RoleGroups.FLOOR_STAFF)
  async getQueues() {
    const visits = await this.visitService.findManyWithPagination({
      relations: { queueEntries: true, patient: true },
      order: { createdAt: 'DESC', queueEntries: { sequenceNumber: 'ASC' } },
      take: 100,
    });
    return formatResponse(visits);
  }

  @Get('/queue/department/:department')
  @Roles(RoleGroups.FLOOR_STAFF)
  async getDepartmentQueue(
    @Param('department', new ParseEnumPipe(Department)) department: Department,
  ) {
    const entries = await this.queueEntries.findByDepartment(department);
    return formatResponse(entries);
  }

  @Get('/queue/visit/:visitId')
  @Roles(RoleGroups.FLOOR_STAFF)
  async getVisitQueue(@Param('visitId', ParseUUIDPipe) visitId: string) {
    const entries = await this.queueEntries.findByVisit(visitId);
    return formatResponse(entries);
  }

  @Post('/queue/entries/:id/call')
  @Roles(RoleGroups.FLOOR_STAFF)
  async callEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const entry = await this.queueEntries.call(id, user.id);
    return formatResponse(entry);
  }

  @Post('/queue/entries/:id/start')
  @Roles(RoleGroups.FLOOR_STAFF)
  async startEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const entry = await this.queueEntries.start(id, user.id);
    return formatResponse(entry);
  }

  @Post('/queue/entries/:id/complete')
  @Roles(RoleGroups.FLOOR_STAFF)
  async completeEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ) {
    const result = await this.queueEntries.complete(id, notes);
    return formatResponse(result);
  }

  @Post('/queue/entries/:id/skip')
  @Roles(RoleGroups.FLOOR_STAFF)
  async skipEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes?: string,
  ) {
    const result = await this.queueEntries.skip(id, notes);
    return formatResponse(result);
  }

  @Delete('/queue/entries/:id')
  @Roles(RoleGroups.RECEPTION)
  async removeEntry(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.queueEntries.remove(id);
    return formatResponse(result);
  }

  @Post('/queue/visit/:visitId/append')
  @Roles(RoleGroups.PROVIDERS)
  async appendVisitIntents(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body('intents') intents: string[],
  ) {
    const created = await this.queueEntries.appendIntents(
      visitId,
      (intents ?? []) as any,
    );
    return formatResponse(created);
  }

  @Post()
  @Roles(RoleGroups.CHECK_IN_STAFF)
  @UsePipes(new ValidationPipe())
  async create(
    @Body() entity: CreateVisitDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const visit = await this.visitService.create({
      ...entity,
      handler: user.id,
    });
    return formatResponse(visit);
  }

  @Get(':id/timeline')
  @Roles(RoleGroups.FLOOR_STAFF)
  async getVisitTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return formatResponse(await this.visitService.timeline(id));
  }

  @Get(':id')
  @Roles(RoleGroups.FLOOR_STAFF)
  async getVisit(@Param('id', ParseUUIDPipe) id: string) {
    const visit = await this.visitService.findByStringId(id, {
      relations: {
        patient: true,
        queueEntries: { servedBy: true },
        checkedInBy: true,
      },
    });
    return formatResponse(visit);
  }

  @Put(':id')
  @Roles(RoleGroups.RECEPTION)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateVisit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() entity: UpdateVisitDTO,
  ) {
    const visit = await this.visitService.update(id, entity);
    return formatResponse(visit);
  }
}
