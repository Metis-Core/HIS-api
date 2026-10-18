import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabModule } from 'src/lab/lab.module';
import { PatientsModule } from 'src/patients/patients.module';
import { PharmacyModule } from 'src/pharmacy/pharmacy.module';
import { QueueModule } from 'src/queue/queue.module';
import { UsersModule } from 'src/users/users.module';
import { ConsultationLifecycleService } from './consultation-lifecycle.service';
import { ConsultationOrdersController } from './consultation-orders.controller';
import { ConsultationQueryService } from './consultation-query.service';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { Consultation } from './entities/consultation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation]),
    PatientsModule,
    UsersModule,
    QueueModule,
    LabModule,
    PharmacyModule,
  ],
  controllers: [ConsultationController, ConsultationOrdersController],
  providers: [
    ConsultationService,
    ConsultationQueryService,
    ConsultationLifecycleService,
  ],
  exports: [ConsultationService, TypeOrmModule],
})
export class ConsultationModule {}
