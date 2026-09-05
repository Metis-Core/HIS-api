import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { InventoryItemType } from '../enums/inventory-item-type.enum';
import { UnitOfMeasure } from '../enums/uintMeasure.enum';

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  sku: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: InventoryItemType, default: InventoryItemType.CONSUMABLE })
  type: InventoryItemType;

  @Column({ type: 'enum', enum: UnitOfMeasure, default: UnitOfMeasure.PCS })
  unitOfMeasure: UnitOfMeasure;

  @Column({ type: 'int', default: 0 })
  minStockLevel: number;

  @Column({ type: 'int', default: 0 })
  reorderLevel: number;

  @Column({ type: 'int', default: 0 })
  unitPrice: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
