import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from 'src/patients/patients.module';
import { UsersModule } from 'src/users/users.module';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntriesService } from './queue-entries.service';
import { QueueGateway } from './queue.gateway';
import { LabOnlyVisitController } from './lab-only-visit.controller';
import { LabOnlyVisitsService } from './lab-only-visits.service';
import { VisitController } from './visit.controller';
import { VisitsService } from './visit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, QueueEntry]),
    PatientsModule,
    UsersModule,
  ],
  controllers: [VisitController, LabOnlyVisitController],
  providers: [
    QueueGateway,
    VisitsService,
    QueueEntriesService,
    LabOnlyVisitsService,
  ],
  exports: [
    VisitsService,
    QueueEntriesService,
    LabOnlyVisitsService,
    TypeOrmModule,
  ],
})
export class QueueModule {}
