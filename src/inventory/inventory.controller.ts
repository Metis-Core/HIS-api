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
import { InventoryTransactionType } from './enums/inventoryTransactionType.enum';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';
import { PaginationQueryDTO } from 'common/pagination';
import { QueryInventoryStockDTO } from './dto/query-inventory-stock.dto';
import { inventoryScopeFor } from './inventory-scope.policy';

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
  async createItem(
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { initialStock, ...itemDto } = dto;
    if (initialStock) await this.storesService.findOne(initialStock.storeId);

    const item = await this.itemsService.create(itemDto);
    if (initialStock) {
      await this.stockService.recordTransaction(
        {
          ...initialStock,
          itemId: item.id,
          type: InventoryTransactionType.RECEIPT,
          notes: 'Opening stock',
        },
        user.id,
      );
    }
    return item;
  }

  @Get('items')
  findAllItems(
    @Query() query: QueryInventoryItemsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.itemsService.search(query, inventoryScopeFor(user.role));
  }

  @Get('items/:id')
  findOneItem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.itemsService.findVisible(id, inventoryScopeFor(user.role));
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
  findAllStores(
    @Query() query: CatalogueFilterDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storesService.search(query, inventoryScopeFor(user.role));
  }

  @Get('stores/active')
  findActiveStores(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.listActive(inventoryScopeFor(user.role));
  }

  @Get('stores/:id')
  findOneStore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storesService.findVisible(id, inventoryScopeFor(user.role));
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
  listStock(
    @Query() query: QueryInventoryStockDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.getStockLevels(
      query,
      inventoryScopeFor(user.role),
    );
  }

  @Get('stock/low')
  listLowStock(
    @Query() query: PaginationQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.listLowStock(query, inventoryScopeFor(user.role));
  }

  @Get('stock/:storeId/:itemId')
  getStock(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.getStockFor(
      storeId,
      itemId,
      inventoryScopeFor(user.role),
    );
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
    return this.stockService.recordTransaction(
      dto,
      user.id,
      undefined,
      inventoryScopeFor(user.role),
    );
  }

  @Get('transactions')
  searchTransactions(
    @Query() query: QueryInventoryTransactionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stockService.searchTransactions(
      query,
      inventoryScopeFor(user.role),
    );
  }
}
