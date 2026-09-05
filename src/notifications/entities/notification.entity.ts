import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notifications')
@Index(['userId', 'status'])
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel, default: NotificationChannel.IN_APP })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  actionUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceType: string | null;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;
}
