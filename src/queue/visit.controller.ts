import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { VisitsService } from './visit.service';
import { formatErrorResponse, formatResponse } from '../../common/response-format';
import { CreateVisitDTO } from './dto/create-visit.dto';
import { UpdateVisitDTO } from './dto/update-visit.dto';
import { UsersService } from '../users/users.service';

@Controller('visits')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class VisitController {
    constructor(private readonly visitService: VisitsService, private readonly userService: UsersService) { }

    @Get()
    async getAllVisits() {
        try {
            const visits = await this.visitService.findManyWithPagination({ relations: { queueEntries: true } })
            return formatResponse(visits)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Get('/queues')
    async getQueues() {
        try {
            const visits = await this.visitService.findManyWithPagination({ relations: { queueEntries: true, patient: true }, take: 100 })
            return formatResponse(visits)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Post()
    @UsePipes(new ValidationPipe())
    async create(@Body() entity: CreateVisitDTO) {
        try {
            const id = '727693f1-815c-4ef1-ab7e-487308761017'
            if (!id || !(await this.userService.findById(id))) {
                throw new NotFoundException('User not found')
            }
            const visit = await this.visitService.create({ ...entity, handler: id })
            return formatResponse(visit)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Get(':id')
    async getVisit(@Param('id') id: string) {
        try {
            const visit = await this.visitService.findByStringId(id, { relations: { queueEntries: true } })
            return formatResponse(visit)
        } catch (error) {
            return formatErrorResponse(error)
        }
    }

    @Put(':id')
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
