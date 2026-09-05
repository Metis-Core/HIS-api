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
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { QueryLabOrdersDto } from './dto/query-lab-orders.dto';
import { QueryLabTestsDto } from './dto/query-lab-tests.dto';
import { UpdateLabOrderItemDto } from './dto/update-lab-order-item.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { LabOrdersService } from './lab-orders.service';
import { LabTestsService } from './lab-tests.service';

@Controller('lab')
export class LabController {
  constructor(
    private readonly labTestsService: LabTestsService,
    private readonly labOrdersService: LabOrdersService,
  ) {}

  @Post('tests')
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.CREATED)
  createTest(@Body() dto: CreateLabTestDto) {
    return this.labTestsService.create(dto);
  }

  @Get('tests')
  findAllTests(@Query() query: QueryLabTestsDto) {
    return this.labTestsService.search(query);
  }

  @Get('tests/:id')
  findOneTest(@Param('id', ParseUUIDPipe) id: string) {
    return this.labTestsService.findOne(id);
  }

  @Patch('tests/:id')
  @Roles(RoleGroups.ADMINS)
  updateTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabTestDto,
  ) {
    return this.labTestsService.update(id, dto);
  }

  @Delete('tests/:id')
  @Roles(RoleGroups.ADMINS)
  removeTest(@Param('id', ParseUUIDPipe) id: string) {
    return this.labTestsService.remove(id);
  }

  @Post('orders')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @Body() dto: CreateLabOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.labOrdersService.createOrder(dto, user.id);
  }

  @Get('orders')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAllOrders(@Query() query: QueryLabOrdersDto) {
    return this.labOrdersService.search(query);
  }

  @Get('orders/patient/:patientId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findOrdersByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.labOrdersService.findByPatient(patientId);
  }

  @Get('orders/consultation/:consultationId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  findOrdersByConsultation(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
  ) {
    return this.labOrdersService.findByConsultation(consultationId);
  }

  @Get('orders/:id')
  @Roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOneOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.labOrdersService.findOne(id);
  }

  @Patch('orders/:id')
  @Roles(UserRole.DOCTOR, UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabOrderDto,
  ) {
    return this.labOrdersService.updateOrder(id, dto);
  }

  @Post('orders/:id/cancel')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.labOrdersService.cancelOrder(id, reason);
  }

  @Patch('orders/:orderId/items/:itemId')
  @Roles(UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateLabOrderItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.labOrdersService.updateItem(orderId, itemId, dto, user.id);
  }
}
