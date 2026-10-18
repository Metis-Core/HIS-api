import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';
import { LabOrder } from './lab-order.entity';
import { LabTest } from './lab-test.entity';
import type {
  LabResultData,
  LabResultFlags,
} from '../results/result-schema.types';

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

  @Column({
    type: 'enum',
    enum: LabOrderItemStatus,
    default: LabOrderItemStatus.PENDING,
  })
  status: LabOrderItemStatus;

  @Column({ type: 'jsonb', nullable: true })
  resultData: LabResultData | null;

  // Computed from the template's reference intervals on every save; never set by hand (L6).
  @Column({ type: 'jsonb', nullable: true })
  resultFlags: LabResultFlags | null;

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

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collectedById' })
  collectedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  collectedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  verifiedById: string | null;

  // Once set the result is locked; corrections go through amendments.
  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resultedAt: Date | null;
}
