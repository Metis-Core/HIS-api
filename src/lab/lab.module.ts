import { Module } from '@nestjs/common';
import { LabService } from './lab.service';
import { LabController } from './lab.controller';

@Module({
  controllers: [LabController],
  providers: [LabService],
})
export class LabModule {}
