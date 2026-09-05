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
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateInventoryStoreDto } from './dto/create-inventory-store.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { QueryInventoryTransactionsDto } from './dto/query-inventory-transactions.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { UpdateInventoryStoreDto } from './dto/update-inventory-store.dto';
import { InventoryItemsService } from './inventory-items.service';
import { InventoryStockService } from './inventory-stock.service';
import { InventoryStoresService } from './inventory-stores.service';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly itemsService: InventoryItemsService,
    private readonly storesService: InventoryStoresService,
    private readonly stockService: InventoryStockService,
  ) {}

  @Post('items')
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.CREATED)
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.itemsService.create(dto);
  }

  @Get('items')
  findAllItems(@Query() query: QueryInventoryItemsDto) {
    return this.itemsService.search(query);
  }

  @Get('items/:id')
  findOneItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch('items/:id')
  @Roles(RoleGroups.ADMINS)
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.itemsService.update(id, dto);
  }

  @Delete('items/:id')
  @Roles(RoleGroups.ADMINS)
  removeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsService.remove(id);
  }

  @Post('stores')
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.CREATED)
  createStore(@Body() dto: CreateInventoryStoreDto) {
    return this.storesService.create(dto);
  }

  @Get('stores')
  findAllStores() {
    return this.storesService.findAll();
  }

  @Get('stores/active')
  findActiveStores() {
    return this.storesService.listActive();
  }

  @Get('stores/:id')
  findOneStore(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.findOne(id);
  }

  @Patch('stores/:id')
  @Roles(RoleGroups.ADMINS)
  updateStore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryStoreDto,
  ) {
    return this.storesService.update(id, dto);
  }

  @Delete('stores/:id')
  @Roles(RoleGroups.ADMINS)
  removeStore(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.remove(id);
  }

  @Get('stock')
  listStock(@Query('storeId') storeId?: string) {
    return this.stockService.getStockLevels(storeId);
  }

  @Get('stock/low')
  listLowStock() {
    return this.stockService.listLowStock();
  }

  @Get('stock/:storeId/:itemId')
  getStock(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.stockService.getStockFor(storeId, itemId);
  }

  @Post('transactions')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.PHARMACIST,
    UserRole.LAB_TECH,
    UserRole.NURSE,
  )
  @HttpCode(HttpStatus.CREATED)
  recordTransaction(
    @Body() dto: CreateInventoryTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.recordTransaction(dto, user.id);
  }

  @Get('transactions')
  searchTransactions(@Query() query: QueryInventoryTransactionsDto) {
    return this.stockService.searchTransactions(query);
  }
}
