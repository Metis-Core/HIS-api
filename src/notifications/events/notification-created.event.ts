export class NotificationCreatedEvent {
  static readonly name = 'notification.created';
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {}
}
