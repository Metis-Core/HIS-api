import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Department } from 'common/enums/department.enum';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { Triage } from 'src/traige/entities/traige.entity';
import { ConsultationStatus } from 'src/consultation/enums/consultation-status.enum';
import { ConsultationType } from 'src/consultation/enums/consultation-type.enum';

@Entity('consultations')
export class Consultation extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  visitId: string | null;

  @ManyToOne(() => Visit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'visitId' })
  visit: Visit | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  triageId: string | null;

  @ManyToOne(() => Triage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'triageId' })
  triage: Triage | null;

  @Index()
  @Column({
    type: 'enum',
    enum: ConsultationType,
    default: ConsultationType.OUTPATIENT,
  })
  type: ConsultationType;

  @Index()
  @Column({
    type: 'enum',
    enum: ConsultationStatus,
    default: ConsultationStatus.IN_PROGRESS,
  })
  status: ConsultationStatus;

  @Column({ type: 'enum', enum: Department, default: Department.OUTPATIENT_CLINIC })
  department: Department;

  @Column({ type: 'varchar', length: 500 })
  chiefComplaint: string;

  @Column({ type: 'text', nullable: true })
  historyOfPresentIllness: string | null;

  @Column({ type: 'text', nullable: true })
  examinationFindings: string | null;

  @Column({ type: 'text', nullable: true })
  assessment: string | null;

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icd10Codes: string | null;

  @Column({ type: 'text', nullable: true })
  plan: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date', nullable: true })
  followUpDate: string | null;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
