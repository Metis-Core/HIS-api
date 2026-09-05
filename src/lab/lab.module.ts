import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PatientsModule } from 'src/patients/patients.module';
import { QueueModule } from 'src/queue/queue.module';
import { UsersModule } from 'src/users/users.module';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabTest } from './entities/lab-test.entity';
import { LabController } from './lab.controller';
import { LabOrdersService } from './lab-orders.service';
import { LabTestsService } from './lab-tests.service';
import { LabNotificationsListener } from './listeners/lab-notifications.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabTest, LabOrder, LabOrderItem]),
    PatientsModule,
    UsersModule,
    NotificationsModule,
    QueueModule,
  ],
  controllers: [LabController],
  providers: [LabTestsService, LabOrdersService, LabNotificationsListener],
  exports: [LabTestsService, LabOrdersService],
})
export class LabModule {}
