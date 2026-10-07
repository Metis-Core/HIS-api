import type { Notification } from '../entities/notification.entity';

export class NotificationCreatedEvent {
  static readonly name = 'notification.created';
  constructor(public readonly notification: Notification) {}

  get notificationId(): string {
    return this.notification.id;
  }

  get userId(): string {
    return this.notification.userId;
  }
}
