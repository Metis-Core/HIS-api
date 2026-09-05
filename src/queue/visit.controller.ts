import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
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
import { formatErrorResponse, formatResponse } from '../../common/response-format';
import { CreateVisitDTO } from './dto/create-visit.dto';
import { UpdateVisitDTO } from './dto/update-visit.dto';

@Controller('visits')
export class VisitController {
    constructor(
        private readonly visitService: VisitsService,
        private readonly queueEntries: QueueEntriesService,
    ) { }

    @Get()
    @Roles(RoleGroups.FLOOR_STAFF)
    async getAllVisits() {
        try {
            const visits = await this.visitService.findManyWithPagination({ relations: { queueEntries: true } })
            return formatResponse(visits)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Get('/queues')
    @Roles(RoleGroups.FLOOR_STAFF)
    async getQueues() {
        try {
            const visits = await this.visitService.findManyWithPagination({ relations: { queueEntries: true, patient: true }, take: 100 })
            return formatResponse(visits)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Get('/queue/department/:department')
    @Roles(RoleGroups.FLOOR_STAFF)
    async getDepartmentQueue(@Param('department') department: Department) {
        try {
            const entries = await this.queueEntries.findByDepartment(department)
            return formatResponse(entries)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Get('/queue/visit/:visitId')
    @Roles(RoleGroups.FLOOR_STAFF)
    async getVisitQueue(@Param('visitId', ParseUUIDPipe) visitId: string) {
        try {
            const entries = await this.queueEntries.findByVisit(visitId)
            return formatResponse(entries)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post('/queue/entries/:id/call')
    @Roles(RoleGroups.FLOOR_STAFF)
    async callEntry(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        try {
            const entry = await this.queueEntries.call(id, user.id)
            return formatResponse(entry)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post('/queue/entries/:id/start')
    @Roles(RoleGroups.FLOOR_STAFF)
    async startEntry(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        try {
            const entry = await this.queueEntries.start(id, user.id)
            return formatResponse(entry)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post('/queue/entries/:id/complete')
    @Roles(RoleGroups.FLOOR_STAFF)
    async completeEntry(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('notes') notes?: string,
    ) {
        try {
            const result = await this.queueEntries.complete(id, notes)
            return formatResponse(result)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post('/queue/entries/:id/skip')
    @Roles(RoleGroups.FLOOR_STAFF)
    async skipEntry(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('notes') notes?: string,
    ) {
        try {
            const result = await this.queueEntries.skip(id, notes)
            return formatResponse(result)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Delete('/queue/entries/:id')
    @Roles(RoleGroups.RECEPTION)
    async removeEntry(@Param('id', ParseUUIDPipe) id: string) {
        try {
            const result = await this.queueEntries.remove(id)
            return formatResponse(result)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post('/queue/visit/:visitId/append')
    @Roles(RoleGroups.CLINICAL_STAFF)
    async appendVisitIntents(
        @Param('visitId', ParseUUIDPipe) visitId: string,
        @Body('intents') intents: string[],
    ) {
        try {
            const created = await this.queueEntries.appendIntents(visitId, (intents ?? []) as any)
            return formatResponse(created)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post()
    @Roles(RoleGroups.CHECK_IN_STAFF)
    @UsePipes(new ValidationPipe())
    async create(@Body() entity: CreateVisitDTO, @CurrentUser() user: AuthenticatedUser) {
        try {
            const visit = await this.visitService.create({ ...entity, handler: user.id })
            return formatResponse(visit)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Get(':id')
    @Roles(RoleGroups.FLOOR_STAFF)
    async getVisit(@Param('id') id: string) {
        try {
            const visit = await this.visitService.findByStringId(id, {
                relations: {
                    patient: true,
                    queueEntries: { servedBy: true },
                    checkedInBy: true,
                },
            })
            return formatResponse(visit)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Put(':id')
    @Roles(RoleGroups.RECEPTION)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async updateVisit(@Param('id') id: string, @Body() entity: UpdateVisitDTO) {
        try {
            const visit = await this.visitService.update(id, entity)
            return formatResponse(visit)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }
}
