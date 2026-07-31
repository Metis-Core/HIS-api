import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from 'src/patients/patients.module';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, QueueEntry]),
    PatientsModule,
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService, TypeOrmModule],
})
export class QueueModule {}
