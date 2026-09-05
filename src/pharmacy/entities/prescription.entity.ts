import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { PrescriptionStatus } from '../enums/prescription-status.enum';
import { PrescriptionItem } from './prescription-item.entity';

@Entity('prescriptions')
@Index(['patientId', 'status'])
export class Prescription extends BaseEntity {
  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Consultation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'consultationId' })
  consultation: Consultation | null;

  @Column({ type: 'uuid', nullable: true })
  consultationId: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'prescribedById' })
  prescribedBy: User;

  @Column({ type: 'uuid' })
  prescribedById: string;

  @Column({ type: 'enum', enum: PrescriptionStatus, default: PrescriptionStatus.PENDING })
  status: PrescriptionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PrescriptionItem, (item) => item.prescription, {
    cascade: true,
  })
  items: PrescriptionItem[];
}
