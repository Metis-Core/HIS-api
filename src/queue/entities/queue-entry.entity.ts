import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Department } from 'common/enums/department.enum';
import { User } from 'src/users/entities/user.entity';
import { QueueEntryStatus } from 'src/queue/enums/queue-entry-status.enum';
import { Visit } from 'src/queue/entities/visit.entity';

@Entity('queue_entries')
export class QueueEntry extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  visitId: string;

  @ManyToOne(() => Visit, (visit) => visit.queueEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'visitId' })
  visit: Visit;

  @Index()
  @Column({ type: 'enum', enum: Department })
  department: Department;

  @Index()
  @Column({
    type: 'enum',
    enum: QueueEntryStatus,
    default: QueueEntryStatus.WAITING,
  })
  status: QueueEntryStatus;

  @Column({ type: 'int' })
  priority: number;

  @Column({ type: 'int' })
  sequenceNumber: number;

  @Column({ type: 'uuid', nullable: true })
  servedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'servedById' })
  servedBy: User | null;

  @Column({ type: 'timestamp', nullable: true })
  calledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
