import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilityPeriodsService } from './availability-periods.service';
import { AvailabilityPeriod } from './entities/availability-period.entity';
import { StaffAvailabilityService } from './staff-availability.service';

@Module({
  imports: [TypeOrmModule.forFeature([AvailabilityPeriod, User]), UsersModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityPeriodsService, StaffAvailabilityService],
  exports: [AvailabilityPeriodsService],
})
export class AvailabilityModule {}
