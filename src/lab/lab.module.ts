import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { DiskFileStorage } from 'common/storage/disk-file-storage';
import { FileStorage } from 'common/storage/file-storage';
import { attachmentUploadOptions } from './attachments/attachment-upload.options';
import { LabAttachment } from './attachments/lab-attachment.entity';
import { LabAttachmentsController } from './attachments/lab-attachments.controller';
import { LabAttachmentsService } from './attachments/lab-attachments.service';
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
import { LabReportsController } from './reports/lab-reports.controller';
import { LabReportsService } from './reports/lab-reports.service';
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
      LabAttachment,
    ]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: attachmentUploadOptions,
    }),
    PatientsModule,
    UsersModule,
    NotificationsModule,
    QueueModule,
  ],
  controllers: [
    LabController,
    LabResultsController,
    LabBoardController,
    LabAttachmentsController,
    LabReportsController,
  ],
  providers: [
    LabTestsService,
    LabOrdersService,
    LabOrderIntakeService,
    LabResultsService,
    LabOrderProgressService,
    LabAmendmentsService,
    LabBoardService,
    LabAttachmentsService,
    LabReportsService,
    { provide: FileStorage, useClass: DiskFileStorage },
  ],
  exports: [LabTestsService, LabOrdersService, LabOrderIntakeService],
})
export class LabModule {}
