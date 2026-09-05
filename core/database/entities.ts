import { AuthToken } from 'src/auth/entities/auth-token.entity';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Contact } from 'src/contacts/entities/contact.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { InventoryStock } from 'src/inventory/entities/inventory-stock.entity';
import { InventoryStore } from 'src/inventory/entities/inventory-store.entity';
import { InventoryTransaction } from 'src/inventory/entities/inventory-transaction.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabOrderItem } from 'src/lab/entities/lab-order-item.entity';
import { LabTest } from 'src/lab/entities/lab-test.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { OneTimePassword } from 'src/otp/entities/otp.entity';
import { Patient } from 'src/patients/entities/patient.entity';
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
  AuthToken,
  Patient,
  Contact,
  Triage,
  Visit,
  QueueEntry,
  Consultation,
  OneTimePassword,
  Service,
  Notification,
  LabTest,
  LabOrder,
  LabOrderItem,
  InventoryStore,
  InventoryItem,
  InventoryStock,
  InventoryTransaction,
  Prescription,
  PrescriptionItem,
  Dispense,
  DispenseItem,
];
