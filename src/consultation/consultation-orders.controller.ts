import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { LabOrdersService } from 'src/lab/lab-orders.service';
import { releaseFor } from 'src/lab/results/release';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { ConsultationOrdersService } from './consultation-orders.service';
import {
  CreateConsultationLabOrderDTO,
  CreateConsultationPrescriptionDTO,
} from './dto/consultation-orders.dto';

/** Lab orders and prescriptions raised from inside a consultation. */
@Controller('consultations')
export class ConsultationOrdersController {
  constructor(
    private readonly orders: ConsultationOrdersService,
    private readonly labOrdersService: LabOrdersService,
    private readonly pharmacyService: PharmacyService,
  ) {}

  @Get(':id/lab-orders')
  @Roles(RoleGroups.CLINICAL_STAFF)
  async listLabOrders(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return releaseFor(
      user.role,
      await this.labOrdersService.findByConsultation(id),
    );
  }

  @Post(':id/lab-orders')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  createLabOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateConsultationLabOrderDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.orderLabs(id, dto, user);
  }

  @Post(':id/prescriptions')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  createPrescription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateConsultationPrescriptionDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.prescribe(id, dto, user);
  }

  @Get(':id/prescriptions')
  @Roles(RoleGroups.CLINICAL_STAFF)
  listPrescriptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.search({ consultationId: id });
  }
}
