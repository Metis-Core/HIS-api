import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PatientsModule } from 'src/patients/patients.module';
import { QueueModule } from 'src/queue/queue.module';
import { UsersModule } from 'src/users/users.module';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabResultAmendment } from './entities/lab-result-amendment.entity';
import { LabTest } from './entities/lab-test.entity';
import { LabBoardController } from './lab-board.controller';
import { LabBoardService } from './lab-board.service';
import { LabController } from './lab.controller';
import { LabOrderIntakeService } from './lab-order-intake.service';
import { LabOrdersService } from './lab-orders.service';
import { LabAmendmentsService } from './lab-amendments.service';
import { LabOrderProgressService } from './lab-order-progress.service';
import { LabResultsController } from './lab-results.controller';
import { LabResultsService } from './lab-results.service';
import { LabTestsService } from './lab-tests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LabTest,
      LabOrder,
      LabOrderItem,
      LabResultAmendment,
    ]),
    PatientsModule,
    UsersModule,
    NotificationsModule,
    QueueModule,
  ],
  controllers: [LabController, LabResultsController, LabBoardController],
  providers: [
    LabTestsService,
    LabOrdersService,
    LabOrderIntakeService,
    LabResultsService,
    LabOrderProgressService,
    LabAmendmentsService,
    LabBoardService,
  ],
  exports: [LabTestsService, LabOrdersService, LabOrderIntakeService],
})
export class LabModule {}
