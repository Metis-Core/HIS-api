import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { ClinicController } from './clinic.controller';
import { ClinicRecordsService } from './clinic-records.service';
import { ClinicRecord } from './entities/clinic-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicRecord, Patient, Visit])],
  controllers: [ClinicController],
  providers: [ClinicRecordsService],
})
export class ClinicModule {}
