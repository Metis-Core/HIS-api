import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';
import { LabOrder } from './lab-order.entity';
import { LabTest } from './lab-test.entity';

@Entity('lab_order_items')
@Index(['orderId', 'testId'], { unique: true })
export class LabOrderItem extends BaseEntity {
  @ManyToOne(() => LabOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: LabOrder;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => LabTest, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'testId' })
  test: LabTest;

  @Column({ type: 'uuid' })
  testId: string;

  @Column({ type: 'enum', enum: LabOrderItemStatus, default: LabOrderItemStatus.PENDING })
  status: LabOrderItemStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resultValue: string | null;

  @Column({ type: 'text', nullable: true })
  resultNotes: string | null;

  @Column({ type: 'boolean', default: false })
  isAbnormal: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resultedById' })
  resultedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  resultedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  collectedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resultedAt: Date | null;
}
