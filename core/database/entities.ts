import { Admission } from 'src/admissions/entities/admission.entity';
import { ClinicRecord } from 'src/clinic/entities/clinic-record.entity';
import { Message } from 'src/messages/entities/message.entity';
import { AuditLog } from 'src/auditLogs/entities/audit-log.entity';
import { AuthToken } from 'src/auth/entities/auth-token.entity';
import { AvailabilityPeriod } from 'src/availability/entities/availability-period.entity';
import { ConsultationAddendum } from 'src/consultation/entities/consultation-addendum.entity';
import { ConsultationDiagnosis } from 'src/consultation/entities/consultation-diagnosis.entity';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Contact } from 'src/contacts/entities/contact.entity';
import { DiagnosisCode } from 'src/diagnoses/entities/diagnosis-code.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { InventoryStock } from 'src/inventory/entities/inventory-stock.entity';
import { InventoryStore } from 'src/inventory/entities/inventory-store.entity';
import { InventoryTransaction } from 'src/inventory/entities/inventory-transaction.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabOrderItem } from 'src/lab/entities/lab-order-item.entity';
import { LabAttachment } from 'src/lab/attachments/lab-attachment.entity';
import { LabResultAmendment } from 'src/lab/entities/lab-result-amendment.entity';
import { LabTest } from 'src/lab/entities/lab-test.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { ProcedureOrder } from 'src/orders/entities/procedure-order.entity';
import { ProcedureTest } from 'src/orders/entities/procedure-test.entity';
import { DayClosing } from 'src/payments/entities/day-closing.entity';
import { Invoice } from 'src/payments/entities/invoice.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { OneTimePassword } from 'src/otp/entities/otp.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { VisitCharge } from 'src/payments/entities/visit-charge.entity';
import { Dispense } from 'src/pharmacy/entities/dispense.entity';
import { DispenseItem } from 'src/pharmacy/entities/dispense-item.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { PrescriptionItem } from 'src/pharmacy/entities/prescription-item.entity';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { Service } from 'src/services/entities/service.entity';
import { Triage } from 'src/traige/entities/traige.entity';
import { User } from 'src/users/entities/user.entity';

export const entities = [
  User,
  AvailabilityPeriod,
  AuthToken,
  Patient,
  Contact,
  Triage,
  Visit,
  QueueEntry,
  Consultation,
  ConsultationAddendum,
  ConsultationDiagnosis,
  DiagnosisCode,
  Admission,
  ClinicRecord,
  Message,
  OneTimePassword,
  Service,
  Notification,
  ProcedureOrder,
  ProcedureTest,
  Invoice,
  Payment,
  DayClosing,
  LabTest,
  LabOrder,
  LabOrderItem,
  LabResultAmendment,
  LabAttachment,
  InventoryStore,
  InventoryItem,
  InventoryStock,
  InventoryTransaction,
  Prescription,
  PrescriptionItem,
  Dispense,
  DispenseItem,
  VisitCharge,
  AuditLog,
];
