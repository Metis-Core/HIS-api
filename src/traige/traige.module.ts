import { Module } from '@nestjs/common';
import { TraigeService } from './traige.service';
import { TraigeController } from './traige.controller';

@Module({
  controllers: [TraigeController],
  providers: [TraigeService],
})
export class TraigeModule {}
