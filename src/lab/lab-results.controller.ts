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
import { PaginationQueryDTO } from 'common/pagination';
import { AmendLabResultDTO } from './dto/amend-lab-result.dto';
import { UpdateLabOrderItemDto } from './dto/update-lab-order-item.dto';
import { LabAmendmentsService } from './lab-amendments.service';
import { LabResultsService } from './lab-results.service';

@Controller('lab/orders/:orderId/items/:itemId')
export class LabResultsController {
  constructor(
    private readonly results: LabResultsService,
    private readonly amendments: LabAmendmentsService,
  ) {}

  @Patch()
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  update(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateLabOrderItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.results.updateItem(orderId, itemId, dto, user.id);
  }

  @Post('verify')
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  verify(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.results.verify(orderId, itemId, user.id);
  }

  @Post('amend')
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  amend(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: AmendLabResultDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.results.amend(orderId, itemId, dto, user.id);
  }

  @Get('amendments')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  findAmendments(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query() query: PaginationQueryDTO,
  ) {
    return this.amendments.findForItem(orderId, itemId, query);
  }
}
