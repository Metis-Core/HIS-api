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
import { ConsciousnessLevel } from 'src/traige/enums/consciousness-level.enum';
import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';

@Entity('triages')
export class Triage extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'uuid' })
  triagedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'triagedById' })
  triagedBy: User;

  @Index()
  @Column({ type: 'enum', enum: TriageAcuity })
  acuity: TriageAcuity;

  @Index()
  @Column({
    type: 'enum',
    enum: TriageStatus,
    default: TriageStatus.WAITING,
  })
  status: TriageStatus;

  @Column({ type: 'varchar', length: 500 })
  chiefComplaint: string;

  @Column({ type: 'text', nullable: true })
  assessmentNotes: string | null;

  @Column({
    type: 'enum',
    enum: ConsciousnessLevel,
    default: ConsciousnessLevel.UNKNOWN,
  })
  consciousness: ConsciousnessLevel;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperatureC: string | null;

  @Column({ type: 'int', nullable: true })
  heartRate: number | null;

  @Column({ type: 'int', nullable: true })
  respiratoryRate: number | null;

  @Column({ type: 'int', nullable: true })
  bloodPressureSystolic: number | null;

  @Column({ type: 'int', nullable: true })
  bloodPressureDiastolic: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  oxygenSaturation: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weightKg: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: string | null;

  @Column({ type: 'int', nullable: true })
  painScore: number | null;

  @Column({ type: 'text', nullable: true })
  allergiesNoted: string | null;

  @Column({ type: 'enum', enum: Department, nullable: true })
  referredToDepartment: Department | null;

  @Column({ type: 'timestamp' })
  arrivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  triagedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  queueNumber: string | null;
}
