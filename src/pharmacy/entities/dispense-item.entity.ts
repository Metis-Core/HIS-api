import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Dispense } from './dispense.entity';
import { PrescriptionItem } from './prescription-item.entity';

@Entity('dispense_items')
export class DispenseItem extends BaseEntity {
  @ManyToOne(() => Dispense, (d) => d.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispenseId' })
  dispense: Dispense;

  @Column({ type: 'uuid' })
  dispenseId: string;

  @ManyToOne(() => PrescriptionItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'prescriptionItemId' })
  prescriptionItem: PrescriptionItem;

  @Column({ type: 'uuid' })
  prescriptionItemId: string;

  @Column({ type: 'int' })
  quantity: number;
}
