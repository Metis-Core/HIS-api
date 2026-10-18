import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestContextInterceptor } from 'core/request-context/request-context.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'core/database/database.module';
import { SecurityModule } from 'core/security/security.module';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditLogsModule } from './auditLogs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { ConsultationModule } from './consultation/consultation.module';
import { ContactsModule } from './contacts/contacts.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { DiagnosesModule } from './diagnoses/diagnoses.module';
import { DoctorsModule } from './doctors/doctors.module';
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
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    SecurityModule,
    AuthModule,
    UsersModule,
    AvailabilityModule,
    DoctorsModule,
    PharmacyModule,
    NotificationsModule,
    PaymentsModule,
    LabModule,
    PatientsModule,
    AuditLogsModule,
    InventoryModule,
    AnalyticsModule,
    TraigeModule,
    ConsultationModule,
    DiagnosesModule,
    AdmissionsModule,
    QueueModule,
    ContactsModule,
    OtpModule,
    ServicesModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
  ],
})
export class AppModule {}
