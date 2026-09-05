import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { InventoryStore } from 'src/inventory/entities/inventory-store.entity';
import { User } from 'src/users/entities/user.entity';
import { DispenseItem } from './dispense-item.entity';
import { Prescription } from './prescription.entity';

@Entity('dispenses')
export class Dispense extends BaseEntity {
  @ManyToOne(() => Prescription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescriptionId' })
  prescription: Prescription;

  @Column({ type: 'uuid' })
  prescriptionId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'dispensedById' })
  dispensedBy: User;

  @Column({ type: 'uuid' })
  dispensedById: string;

  @ManyToOne(() => InventoryStore, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'storeId' })
  store: InventoryStore;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => DispenseItem, (item) => item.dispense, {
    cascade: true,
  })
  items: DispenseItem[];
}
