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
import { ConsultationService } from './consultation.service';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateConsultationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consultationService.create(dto, user.id);
  }

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF)
  findAll(@Query() query: QueryConsultationsDto) {
    return this.consultationService.search(query);
  }

  @Get('patient/:patientId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.consultationService.findByPatient(patientId);
  }

  @Get('visit/:visitId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.consultationService.findByVisit(visitId);
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
  ) {
    return this.consultationService.update(id, dto);
  }

  @Put(':id')
  @Roles(RoleGroups.PROVIDERS)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationService.update(id, dto);
  }

  @Post(':id/complete')
  @Roles(RoleGroups.PROVIDERS)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    return this.consultationService.complete(id, dto);
  }

  @Post(':id/cancel')
  @Roles(RoleGroups.PROVIDERS)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.consultationService.cancel(id, reason);
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationService.cancel(id);
  }
}
