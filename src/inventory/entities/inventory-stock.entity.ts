import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { InventoryItem } from './inventory-item.entity';
import { InventoryStore } from './inventory-store.entity';

@Entity('inventory_stock')
@Index(['storeId', 'itemId'], { unique: true })
export class InventoryStock extends BaseEntity {
  @ManyToOne(() => InventoryStore, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: InventoryStore;

  @Column({ type: 'uuid' })
  storeId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRestockedAt: Date | null;
}
