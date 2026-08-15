import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from 'src/patients/patients.module';
import { UsersModule } from 'src/users/users.module';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueGateway } from './queue.gateway';
import { VisitController } from './visit.controller';
import { VisitsService } from './visit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, QueueEntry]),
    PatientsModule,
    UsersModule,
  ],
  controllers: [VisitController],
  providers: [QueueGateway, VisitsService],
  exports: [VisitsService, TypeOrmModule],
})
export class QueueModule { }
