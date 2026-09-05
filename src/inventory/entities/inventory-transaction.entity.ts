import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { InventoryTransactionType } from '../enums/inventoryTransactionType.enum';
import { InventoryItem } from './inventory-item.entity';
import { InventoryStore } from './inventory-store.entity';

@Entity('inventory_transactions')
@Index(['storeId', 'itemId', 'createdAt'])
export class InventoryTransaction extends BaseEntity {
  @ManyToOne(() => InventoryStore, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'storeId' })
  store: InventoryStore;

  @Column({ type: 'uuid' })
  storeId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'enum', enum: InventoryTransactionType })
  type: InventoryTransactionType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  runningBalance: number;

  @ManyToOne(() => InventoryStore, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'counterpartStoreId' })
  counterpartStore: InventoryStore | null;

  @Column({ type: 'uuid', nullable: true })
  counterpartStoreId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceType: string | null;

  @Column({ type: 'uuid', nullable: true })
  referenceId: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column({ type: 'uuid' })
  performedById: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
