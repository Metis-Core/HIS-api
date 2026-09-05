import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationPriority } from 'src/notifications/enums/notification-priority.enum';
import { NotificationType } from 'src/notifications/enums/notification-type.enum';
import { LabOrderCompletedEvent } from '../events/lab-order-completed.event';

@Injectable()
export class LabNotificationsListener {
  private readonly logger = new Logger(LabNotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(LabOrderCompletedEvent.name, { async: true })
  async onLabOrderCompleted(event: LabOrderCompletedEvent) {
    try {
      await this.notificationsService.create({
        userId: event.orderedById,
        type: NotificationType.LAB_RESULT,
        priority: NotificationPriority.HIGH,
        title: 'Lab results ready',
        body: 'Results are ready for review for one of your lab orders.',
        resourceType: 'lab_order',
        resourceId: event.orderId,
      });
    } catch (error) {
      this.logger.error('Failed to emit lab result notification', error as Error);
    }
  }
}
