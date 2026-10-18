import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { PatientsModule } from 'src/patients/patients.module';
import { QueueModule } from 'src/queue/queue.module';
import { ServicesModule } from 'src/services/services.module';
import { ProcedureOrder } from './entities/procedure-order.entity';
import { ProcedureOrdersController } from './procedure-orders.controller';
import { ProcedureOrdersService } from './procedure-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcedureOrder, Consultation]),
    PatientsModule,
    QueueModule,
    ServicesModule,
  ],
  controllers: [ProcedureOrdersController],
  providers: [ProcedureOrdersService],
  exports: [ProcedureOrdersService, TypeOrmModule],
})
export class OrdersModule {}
