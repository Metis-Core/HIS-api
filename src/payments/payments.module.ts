import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from 'src/queue/entities/visit.entity';
import { QueueModule } from 'src/queue/queue.module';
import { ServicesModule } from 'src/services/services.module';
import { DayClosingService } from './day-closing.service';
import { DayClosingsController } from './day-closings.controller';
import { DayClosing } from './entities/day-closing.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { VisitCharge } from './entities/visit-charge.entity';
import {
  InvoicesController,
  PaymentLedgerController,
} from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { BillingListener } from './listeners/billing.listener';
import { PaymentLedgerService } from './payment-ledger.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ReceiptPdfService } from './receipt-pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VisitCharge,
      Invoice,
      Payment,
      DayClosing,
      Visit,
    ]),
    ServicesModule,
    QueueModule,
  ],
  controllers: [
    PaymentsController,
    InvoicesController,
    PaymentLedgerController,
    DayClosingsController,
  ],
  providers: [
    PaymentsService,
    InvoicesService,
    PaymentLedgerService,
    DayClosingService,
    ReceiptPdfService,
    BillingListener,
  ],
  exports: [PaymentsService, InvoicesService],
})
export class PaymentsModule {}
