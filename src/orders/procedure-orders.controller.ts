import {
  Body,
  Controller,
  Get,
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
import { formatResponse } from 'common/response-format';
import { CreateProcedureOrderDto } from './dto/create-procedure-order.dto';
import { QueryProcedureOrdersDto } from './dto/query-procedure-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProcedureOrdersService } from './procedure-orders.service';

@Controller('orders')
export class ProcedureOrdersController {
  constructor(private readonly orders: ProcedureOrdersService) {}

  @Post()
  @Roles(RoleGroups.PROCEDURE_ORDERERS)
  async place(
    @Body() dto: CreateProcedureOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.orders.place(dto, user.id));
  }

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async list(@Query() query: QueryProcedureOrdersDto) {
    return formatResponse(await this.orders.search(query));
  }

  @Get(':id')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async one(@Param('id', ParseUUIDPipe) id: string) {
    return formatResponse(await this.orders.details(id));
  }

  @Patch(':id/status')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async advance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.orders.advance(id, dto, user));
  }
}
