import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { LabModule } from './lab/lab.module';
import { PatientsModule } from './patients/patients.module';
import { AuditlogsModule } from './auditlogs/auditlogs.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TraigeModule } from './traige/traige.module';
import { ConsultationModule } from './consultation/consultation.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, UsersModule, PharmacyModule, NotificationsModule, PaymentsModule, LabModule, PatientsModule, AuditlogsModule, InventoryModule, AnalyticsModule, TraigeModule, ConsultationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
