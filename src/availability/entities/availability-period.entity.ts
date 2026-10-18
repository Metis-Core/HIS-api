import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { User } from 'src/users/entities/user.entity';

@Entity('availability_periods')
@Index(['userId', 'startsAt'])
export class AvailabilityPeriod extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AvailabilityStatus })
  status: AvailabilityStatus;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;
}
