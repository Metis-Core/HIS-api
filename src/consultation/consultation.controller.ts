import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { PaginationQueryDTO } from 'common/pagination';
import { ConsultationLifecycleService } from './consultation-lifecycle.service';
import { ConsultationQueryService } from './consultation-query.service';
import { ConsultationService } from './consultation.service';
import { CancelConsultationDTO } from './dto/cancel-consultation.dto';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Controller('consultations')
export class ConsultationController {
  constructor(
    private readonly consultationService: ConsultationService,
    private readonly queries: ConsultationQueryService,
    private readonly lifecycle: ConsultationLifecycleService,
  ) {}

  @Post()
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateConsultationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consultationService.open(dto, user);
  }

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF)
  findAll(@Query() query: QueryConsultationsDto) {
    return this.queries.search(query);
  }

  @Get('patient/:patientId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: PaginationQueryDTO,
  ) {
    return this.queries.findByPatient(patientId, query);
  }

  @Get('visit/:visitId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.queries.findByVisit(visitId);
  }

  @Get(':id')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleGroups.PROVIDERS)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consultationService.edit(id, dto, user);
  }

  @Put(':id')
  @Roles(RoleGroups.PROVIDERS)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consultationService.edit(id, dto, user);
  }

  @Post(':id/complete')
  @Roles(RoleGroups.PROVIDERS)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteConsultationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lifecycle.complete(id, dto, user);
  }

  @Post(':id/cancel')
  @Roles(RoleGroups.PROVIDERS)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelConsultationDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lifecycle.cancel(id, user, dto.reason);
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lifecycle.cancel(id, user);
  }
}
