import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './entities/notification.entity';
import { NotificationStatus } from './enums/notification-status.enum';
import { NotificationCreatedEvent } from './events/notification-created.event';

@Injectable()
export class NotificationsService extends BaseCrudService<Notification> {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(notificationsRepository);
  }

  override async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId: dto.userId,
      type: dto.type,
      channel: dto.channel,
      priority: dto.priority,
      status: NotificationStatus.UNREAD,
      title: dto.title.trim(),
      body: dto.body.trim(),
      actionUrl: dto.actionUrl ?? null,
      resourceType: dto.resourceType ?? null,
      resourceId: dto.resourceId ?? null,
    });
    const saved = await this.notificationsRepository.save(notification);
    this.eventEmitter.emit(
      NotificationCreatedEvent.name,
      new NotificationCreatedEvent(saved.id, saved.userId),
    );
    return saved;
  }

  async search(query: QueryNotificationsDto): Promise<IPagination<Notification>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortOrder = query.sortOrder ?? 'DESC';

    const qb = this.notificationsRepository.createQueryBuilder('notification');
    if (query.userId) qb.andWhere('notification.userId = :userId', { userId: query.userId });
    if (query.status) qb.andWhere('notification.status = :status', { status: query.status });
    if (query.type) qb.andWhere('notification.type = :type', { type: query.type });

    const [items, total] = await qb
      .orderBy('notification.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findForUser(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<IPagination<Notification>> {
    return this.search({ ...query, userId });
  }

  async countUnread(userId: string): Promise<{ unread: number }> {
    const unread = await this.notificationsRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
    return { unread };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id);
    if (notification.userId !== userId) {
      throw new BadRequestException('Notification does not belong to this user');
    }
    if (notification.status === NotificationStatus.UNREAD) {
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }
    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async archive(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id);
    if (notification.userId !== userId) {
      throw new BadRequestException('Notification does not belong to this user');
    }
    notification.status = NotificationStatus.ARCHIVED;
    return this.notificationsRepository.save(notification);
  }

  override async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    return super.update(id, dto);
  }
}
