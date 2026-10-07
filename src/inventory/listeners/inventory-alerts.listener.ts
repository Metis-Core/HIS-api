import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { NotificationPriority } from 'src/notifications/enums/notification-priority.enum';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User } from 'src/users/entities/user.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryStore } from '../entities/inventory-store.entity';
import { InventoryItemType } from '../enums/inventory-item-type.enum';
import { StockLowEvent } from '../events/stock-low.event';

@Injectable()
export class InventoryAlertsListener {
  private readonly logger = new Logger(InventoryAlertsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(InventoryItem)
    private readonly itemsRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryStore)
    private readonly storesRepository: Repository<InventoryStore>,
  ) {}

  @OnEvent(StockLowEvent.name, { async: true })
  async onStockLow(event: StockLowEvent) {
    try {
      const [item, store] = await Promise.all([
        this.itemsRepository.findOne({ where: { id: event.itemId } }),
        this.storesRepository.findOne({ where: { id: event.storeId } }),
      ]);
      if (!item) return;

      const recipients = await this.usersRepository.find({
        where: {
          role: In(this.rolesFor(item.type)),
          status: AccountStatus.ACTIVE,
        },
      });

      const outOfStock = event.currentQuantity <= 0;
      const where = store ? ` in ${store.name}` : '';
      const title = outOfStock ? `Out of stock: ${item.name}` : `Low stock: ${item.name}`;
      const body = outOfStock
        ? `${item.name} (${item.sku}) has run out${where}.`
        : `${item.name} (${item.sku}) is down to ${event.currentQuantity} ${item.unitOfMeasure}${where}; the minimum is ${event.minStockLevel}.`;

      await Promise.all(
        recipients.map((user) =>
          this.notificationsService.create({
            userId: user.id,
            type: NotificationType.INVENTORY,
            priority: outOfStock ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
            title,
            body,
            actionUrl: '/inventory',
            resourceType: 'inventory_item',
            resourceId: item.id,
          }),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to send low-stock notification', error as Error);
    }
  }

  private rolesFor(type: InventoryItemType): UserRole[] {
    const roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (type === InventoryItemType.MEDICATION) roles.push(UserRole.PHARMACIST);
    if (type === InventoryItemType.REAGENT) roles.push(UserRole.LAB_TECH);
    return roles;
  }
}
