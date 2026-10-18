import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionsModule } from 'src/admissions/admissions.module';
import { DiagnosesModule } from 'src/diagnoses/diagnoses.module';
import { LabModule } from 'src/lab/lab.module';
import { PatientsModule } from 'src/patients/patients.module';
import { PharmacyModule } from 'src/pharmacy/pharmacy.module';
import { QueueModule } from 'src/queue/queue.module';
import { UsersModule } from 'src/users/users.module';
import { ConsultationAddendaController } from './consultation-addenda.controller';
import { ConsultationAddendaService } from './consultation-addenda.service';
import { ConsultationLifecycleService } from './consultation-lifecycle.service';
import { ConsultationOrdersController } from './consultation-orders.controller';
import { ConsultationOrdersService } from './consultation-orders.service';
import { ConsultationDiagnosesService } from './consultation-diagnoses.service';
import { ConsultationReferencesService } from './consultation-references.service';
import { ConsultationQueryService } from './consultation-query.service';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { ConsultationAddendum } from './entities/consultation-addendum.entity';
import { ConsultationDiagnosis } from './entities/consultation-diagnosis.entity';
import { Consultation } from './entities/consultation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consultation,
      ConsultationAddendum,
      ConsultationDiagnosis,
    ]),
    AdmissionsModule,
    DiagnosesModule,
    PatientsModule,
    UsersModule,
    QueueModule,
    LabModule,
    PharmacyModule,
  ],
  controllers: [
    ConsultationController,
    ConsultationOrdersController,
    ConsultationAddendaController,
  ],
  providers: [
    ConsultationService,
    ConsultationQueryService,
    ConsultationLifecycleService,
    ConsultationAddendaService,
    ConsultationOrdersService,
    ConsultationReferencesService,
    ConsultationDiagnosesService,
  ],
  exports: [ConsultationService, TypeOrmModule],
})
export class ConsultationModule {}
