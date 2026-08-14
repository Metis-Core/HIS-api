import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientSubscriber } from './patient.subscriber';
import { PatientListener } from './listeners/patient.listener';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Patient]), forwardRef(() => ContactsModule)],
  controllers: [PatientsController],
  providers: [PatientsService, PatientSubscriber, PatientListener],
  exports: [PatientsService, TypeOrmModule],
})
export class PatientsModule { }
