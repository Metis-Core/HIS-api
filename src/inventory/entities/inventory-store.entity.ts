import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Department } from 'common/enums/department.enum';
import { InventoryStoreType } from '../enums/inventoryType.enum';

@Entity('inventory_stores')
export class InventoryStore extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: InventoryStoreType, default: InventoryStoreType.GENERAL })
  type: InventoryStoreType;

  @Column({ type: 'enum', enum: Department, nullable: true })
  department: Department | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
