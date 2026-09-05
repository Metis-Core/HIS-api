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
import { UserRole } from 'common/enums/userRoles.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { QueryPrescriptionsDto } from './dto/query-prescriptions.dto';
import { PharmacyService } from './pharmacy.service';

@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post('prescriptions')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pharmacyService.createPrescription(dto, user.id);
  }

  @Get('prescriptions')
  @Roles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.PHARMACIST,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  findAll(@Query() query: QueryPrescriptionsDto) {
    return this.pharmacyService.search(query);
  }

  @Get('prescriptions/patient/:patientId')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.PHARMACIST)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.pharmacyService.findByPatient(patientId);
  }

  @Get('prescriptions/:id')
  @Roles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.PHARMACIST,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.findOne(id);
  }

  @Post('prescriptions/:id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.pharmacyService.cancelPrescription(id, reason);
  }

  @Post('prescriptions/:id/dispense')
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  dispense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pharmacyService.dispense(id, dto, user.id);
  }

  @Get('prescriptions/:id/dispenses')
  @Roles(
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.PHARMACIST,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  listDispenses(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.listDispensesFor(id);
  }

  @Delete('prescriptions/:id')
  @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.remove(id);
  }
}
