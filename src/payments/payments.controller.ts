import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { CreateVisitChargeDto } from './dto/create-visit-charge.dto';
import { UpdateChargeStatusDto } from './dto/update-charge-status.dto';
import { PaymentsService } from './payments.service';

@Controller('charges')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('visit/:visitId')
  @Roles(RoleGroups.FLOOR_STAFF)
  billForVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.paymentsService.billForVisit(visitId);
  }

  @Post()
  @Roles(RoleGroups.PROVIDERS)
  create(@Body() dto: CreateVisitChargeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.addCharge(dto, user.id);
  }

  @Patch(':id/status')
  @Roles(RoleGroups.BILLING)
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChargeStatusDto) {
    return this.paymentsService.setStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(RoleGroups.PROVIDERS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
