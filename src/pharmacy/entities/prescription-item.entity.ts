import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { PrescriptionItemStatus } from '../enums/prescription-item-status.enum';
import { Prescription } from './prescription.entity';

@Entity('prescription_items')
export class PrescriptionItem extends BaseEntity {
  @ManyToOne(() => Prescription, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescriptionId' })
  prescription: Prescription;

  @Column({ type: 'uuid' })
  prescriptionId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'varchar', length: 100 })
  dosage: string;

  @Column({ type: 'varchar', length: 100 })
  frequency: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  dispensedQuantity: number;

  @Column({ type: 'enum', enum: PrescriptionItemStatus, default: PrescriptionItemStatus.PENDING })
  status: PrescriptionItemStatus;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;
}
