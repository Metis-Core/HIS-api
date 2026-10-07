import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { User } from 'src/users/entities/user.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { InventoryStore } from './entities/inventory-store.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryController } from './inventory.controller';
import { InventoryItemsService } from './inventory-items.service';
import { InventoryStockService } from './inventory-stock.service';
import { InventoryStoresService } from './inventory-stores.service';
import { InventoryAlertsListener } from './listeners/inventory-alerts.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryItem,
      InventoryStore,
      InventoryStock,
      InventoryTransaction,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [InventoryController],
  providers: [
    InventoryItemsService,
    InventoryStoresService,
    InventoryStockService,
    InventoryAlertsListener,
  ],
  exports: [InventoryItemsService, InventoryStoresService, InventoryStockService],
})
export class InventoryModule {}
