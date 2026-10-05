import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesModule } from 'src/services/services.module';
import { VisitCharge } from './entities/visit-charge.entity';
import { BillingListener } from './listeners/billing.listener';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([VisitCharge]), ServicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, BillingListener],
  exports: [PaymentsService],
})
export class PaymentsModule {}
