import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';

/** A message from one staff member to another or to a team, optionally about a visit. */
@Entity('messages')
@Index(['recipientId', 'readAt'])
@Index(['senderId', 'recipientId', 'createdAt'])
export class Message extends BaseEntity {
  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'uuid' })
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'uuid', nullable: true })
  visitId: string | null;

  @ManyToOne(() => Visit, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'visitId' })
  visit: Visit | null;

  /** Set when the message was written to a team; one copy per member shares a batchId. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  teamRole: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  batchId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;
}
