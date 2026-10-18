import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('day_closings')
export class DayClosing extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'date' })
  businessDate: string;

  @Column({ type: 'uuid' })
  closedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'closedById' })
  closedBy: User;

  @Column({ type: 'timestamptz' })
  closedAt: Date;

  @Column({ type: 'jsonb' })
  totals: Record<string, number>;

  @Column({ type: 'int' })
  expectedCash: number;

  @Column({ type: 'int', nullable: true })
  countedCash: number | null;

  @Column({ type: 'int', nullable: true })
  variance: number | null;

  @Column({ type: 'int' })
  paymentCount: number;

  @Column({ type: 'int' })
  voidedCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;
}
