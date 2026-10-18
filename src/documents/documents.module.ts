import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabResultAmendment } from 'src/lab/entities/lab-result-amendment.entity';
import { ProcedureOrder } from 'src/orders/entities/procedure-order.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { Invoice } from 'src/payments/entities/invoice.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { VisitCharge } from 'src/payments/entities/visit-charge.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LabDocumentsService } from './lab-documents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LabOrder,
      LabResultAmendment,
      Prescription,
      ProcedureOrder,
      Consultation,
      Visit,
      VisitCharge,
      Invoice,
      Payment,
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, LabDocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
