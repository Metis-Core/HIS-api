import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { PatientsModule } from 'src/patients/patients.module';
import { QueueModule } from 'src/queue/queue.module';
import { ServicesModule } from 'src/services/services.module';
import { ProcedureOrder } from './entities/procedure-order.entity';
import { ProcedureTest } from './entities/procedure-test.entity';
import { ProcedureOrdersController } from './procedure-orders.controller';
import { ProcedureOrdersService } from './procedure-orders.service';
import { ProcedureTestsController } from './procedure-tests.controller';
import { ProcedureTestsService } from './procedure-tests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcedureOrder, ProcedureTest, Consultation]),
    PatientsModule,
    QueueModule,
    ServicesModule,
  ],
  controllers: [ProcedureTestsController, ProcedureOrdersController],
  providers: [ProcedureOrdersService, ProcedureTestsService],
  exports: [ProcedureOrdersService, ProcedureTestsService, TypeOrmModule],
})
export class OrdersModule {}
