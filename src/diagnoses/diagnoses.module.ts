import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisCodesController } from './diagnosis-codes.controller';
import { DiagnosisCodesService } from './diagnosis-codes.service';
import { DiagnosisCode } from './entities/diagnosis-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiagnosisCode])],
  controllers: [DiagnosisCodesController],
  providers: [DiagnosisCodesService],
  exports: [DiagnosisCodesService],
})
export class DiagnosesModule {}
