import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from 'core/database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditlogsModule } from './auditLogs/auditlogs.module';
import { AuthModule } from './auth/auth.module';
import { ConsultationModule } from './consultation/consultation.module';
import { ContactsModule } from './contacts/contacts.module';
import { InventoryModule } from './inventory/inventory.module';
import { LabModule } from './lab/lab.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OtpModule } from './otp/otp.module';
import { PatientsModule } from './patients/patients.module';
import { PaymentsModule } from './payments/payments.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { ServicesModule } from './services/services.module';
import { TraigeModule } from './traige/traige.module';
import { UsersModule } from './users/users.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PharmacyModule,
    NotificationsModule,
    PaymentsModule,
    LabModule,
    PatientsModule,
    AuditlogsModule,
    InventoryModule,
    AnalyticsModule,
    TraigeModule,
    ConsultationModule,
    QueueModule,
    ContactsModule,
    OtpModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
