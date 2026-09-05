import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { InventoryModule } from 'src/inventory/inventory.module';
import { PatientsModule } from 'src/patients/patients.module';
import { QueueModule } from 'src/queue/queue.module';
import { UsersModule } from 'src/users/users.module';
import { Dispense } from './entities/dispense.entity';
import { DispenseItem } from './entities/dispense-item.entity';
import { PrescriptionItem } from './entities/prescription-item.entity';
import { Prescription } from './entities/prescription.entity';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prescription,
      PrescriptionItem,
      Dispense,
      DispenseItem,
      InventoryItem,
    ]),
    PatientsModule,
    UsersModule,
    InventoryModule,
    QueueModule,
  ],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
