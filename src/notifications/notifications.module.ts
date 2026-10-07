import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { WorkflowNotificationsListener } from './listeners/workflow-notifications.listener';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsStreamService } from './notifications-stream.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Patient, Visit, QueueEntry, Prescription]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsStreamService,
    NotificationDispatcher,
    WorkflowNotificationsListener,
  ],
  exports: [NotificationsService, NotificationDispatcher],
})
export class NotificationsModule {}
