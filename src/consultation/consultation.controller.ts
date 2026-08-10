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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { ConsultationService } from './consultation.service';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { QueryConsultationsDto } from './dto/query-consultations.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

const CLINICAL_STAFF = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.DOCTOR,
  UserRole.NURSE,
] as const;

const PROVIDERS = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.DOCTOR,
] as const;

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @Roles(...PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateConsultationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.consultationService.create(dto, user.id);
  }

  @Get()
  @Roles(...CLINICAL_STAFF)
  findAll(@Query() query: QueryConsultationsDto) {
    return this.consultationService.findAll(query);
  }

  @Get('patient/:patientId')
  @Roles(...CLINICAL_STAFF)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.consultationService.findByPatient(patientId);
  }

  @Get('visit/:visitId')
  @Roles(...CLINICAL_STAFF)
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.consultationService.findByVisit(visitId);
  }

  @Get(':id')
  @Roles(...CLINICAL_STAFF)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationService.findOne(id);
  }

  @Patch(':id')
  @Roles(...PROVIDERS)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationService.update(id, dto);
  }

  @Put(':id')
  @Roles(...PROVIDERS)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationService.update(id, dto);
  }

  @Post(':id/complete')
  @Roles(...PROVIDERS)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    return this.consultationService.complete(id, dto);
  }

  @Post(':id/cancel')
  @Roles(...PROVIDERS)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.consultationService.cancel(id, reason);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationService.remove(id);
  }
}
