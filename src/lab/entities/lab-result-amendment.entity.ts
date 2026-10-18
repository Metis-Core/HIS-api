import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import type {
  LabResultData,
  LabResultFlags,
} from '../results/result-schema.types';
import { LabOrderItem } from './lab-order-item.entity';

/** Before/after copy of a verified result that was corrected, with who and why (H-10). */
@Entity('lab_result_amendments')
export class LabResultAmendment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => LabOrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: LabOrderItem;

  @Column({ type: 'jsonb', nullable: true })
  previousData: LabResultData | null;

  @Column({ type: 'jsonb', nullable: true })
  previousFlags: LabResultFlags | null;

  @Column({ type: 'text', nullable: true })
  previousNotes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  newData: LabResultData | null;

  @Column({ type: 'text', nullable: true })
  newNotes: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'uuid' })
  amendedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'amendedById' })
  amendedBy: User;

  @Column({ type: 'timestamptz', nullable: true })
  previousVerifiedAt: Date | null;
}
