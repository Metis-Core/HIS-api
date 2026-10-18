import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from 'src/availability/availability.module';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import { DoctorAssignmentListener } from './doctor-assignment.listener';
import { DoctorAssignmentService } from './doctor-assignment.service';
import { DoctorDirectoryService } from './doctor-directory.service';
import { DoctorReconcileJob } from './doctor-reconcile.job';
import { DoctorsController } from './doctors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Visit]), AvailabilityModule],
  controllers: [DoctorsController],
  providers: [
    DoctorDirectoryService,
    DoctorAssignmentService,
    DoctorAssignmentListener,
    DoctorReconcileJob,
  ],
  exports: [DoctorAssignmentService, DoctorDirectoryService],
})
export class DoctorsModule {}
