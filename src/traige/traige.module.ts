import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from 'src/patients/patients.module';
import { UsersModule } from 'src/users/users.module';
import { Triage } from './entities/traige.entity';
import { TraigeController } from './traige.controller';
import { TraigeService } from './traige.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Triage]),
    PatientsModule,
    UsersModule,
  ],
  controllers: [TraigeController],
  providers: [TraigeService],
  exports: [TraigeService, TypeOrmModule],
})
export class TraigeModule {}
