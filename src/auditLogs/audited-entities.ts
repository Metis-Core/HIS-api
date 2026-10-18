import { ClinicRecord } from 'src/clinic/entities/clinic-record.entity';
import { Admission } from 'src/admissions/entities/admission.entity';
import { LabAttachment } from 'src/lab/attachments/lab-attachment.entity';
import { ProcedureOrder } from 'src/orders/entities/procedure-order.entity';
import { ProcedureTest } from 'src/orders/entities/procedure-test.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { DayClosing } from 'src/payments/entities/day-closing.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { VisitCharge } from 'src/payments/entities/visit-charge.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';

// Entities whose create/update/delete history must be kept (F3). Add new ones here.
export const AUDITED_ENTITIES = new Map<unknown, string>([
  [Patient, 'patient'],
  [Visit, 'visit'],
  [User, 'user'],
  [Service, 'service'],
  [Admission, 'admission'],
  [ClinicRecord, 'clinic_record'],
  [LabAttachment, 'lab_attachment'],
  [ProcedureOrder, 'procedure_order'],
  [ProcedureTest, 'procedure_test'],
  [Payment, 'payment'],
  [DayClosing, 'day_closing'],
  [VisitCharge, 'charge'],
]);
