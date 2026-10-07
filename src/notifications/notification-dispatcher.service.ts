import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { User } from 'src/users/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

export type NotificationPayload = Omit<CreateNotificationDto, 'userId'>;

/** Fan-out helper: turns "tell these users / these roles" into persisted notifications (which are then pushed live). */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly notifications: NotificationsService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async toUsers(
    userIds: ReadonlyArray<string | null | undefined>,
    payload: NotificationPayload,
  ): Promise<void> {
    const unique = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
    await Promise.all(
      unique.map((userId) =>
        this.notifications.create({ ...payload, userId }).catch((error) => {
          this.logger.error(`Failed to notify user ${userId}`, error as Error);
        }),
      ),
    );
  }

  async toRoles(
    roles: readonly UserRole[],
    payload: NotificationPayload,
    excludeUserId?: string,
  ): Promise<void> {
    const users = await this.usersRepository.find({
      where: { role: In([...roles]), status: AccountStatus.ACTIVE },
      select: { id: true },
    });
    await this.toUsers(
      users.map((u) => u.id).filter((id) => id !== excludeUserId),
      payload,
    );
  }
}
