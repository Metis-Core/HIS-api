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
import { CreateLabOrderDto } from 'src/lab/dto/create-lab-order.dto';
import { LabOrdersService } from 'src/lab/lab-orders.service';
import { CreatePrescriptionDto } from 'src/pharmacy/dto/create-prescription.dto';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { ConsultationService } from './consultation.service';

/** Lab orders and prescriptions raised from inside a consultation. */
@Controller('consultations')
export class ConsultationOrdersController {
  constructor(
    private readonly consultationService: ConsultationService,
    private readonly labOrdersService: LabOrdersService,
    private readonly pharmacyService: PharmacyService,
  ) {}

  @Get(':id/lab-orders')
  @Roles(RoleGroups.CLINICAL_STAFF)
  listLabOrders(@Param('id', ParseUUIDPipe) id: string) {
    return this.labOrdersService.findByConsultation(id);
  }

  @Post(':id/lab-orders')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  async createLabOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    dto: Omit<CreateLabOrderDto, 'consultationId' | 'patientId'> & {
      patientId?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const consultation = await this.consultationService.findOne(id);
    return this.labOrdersService.createOrder(
      {
        ...dto,
        patientId: consultation.patientId,
        consultationId: id,
        visitId: consultation.visitId ?? undefined,
      },
      user.id,
    );
  }

  @Post(':id/prescriptions')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  async createPrescription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    dto: Omit<CreatePrescriptionDto, 'consultationId' | 'patientId'> & {
      patientId?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const consultation = await this.consultationService.findOne(id);
    return this.pharmacyService.createPrescription(
      {
        ...dto,
        patientId: consultation.patientId,
        consultationId: id,
      },
      user.id,
    );
  }

  @Get(':id/prescriptions')
  @Roles(RoleGroups.CLINICAL_STAFF)
  listPrescriptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.search({ consultationId: id });
  }
}
