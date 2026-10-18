import { Admission } from 'src/admissions/entities/admission.entity';
import { LabAttachment } from 'src/lab/attachments/lab-attachment.entity';
import { Patient } from 'src/patients/entities/patient.entity';
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
  [LabAttachment, 'lab_attachment'],
]);
