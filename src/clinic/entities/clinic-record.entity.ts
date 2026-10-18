import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import type {
  LabResultData,
  LabResultFlags,
} from 'src/lab/results/result-schema.types';
import { ClinicRecordKind } from '../enums/clinic-record-kind.enum';

/** A structured antenatal, delivery, postnatal or immunization record taken from the matching template. */
@Entity('clinic_records')
@Index(['patientId', 'kind'])
export class ClinicRecord extends BaseEntity {
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  visitId: string | null;

  @ManyToOne(() => Visit, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'visitId' })
  visit: Visit | null;

  @Index()
  @Column({ type: 'enum', enum: ClinicRecordKind })
  kind: ClinicRecordKind;

  @Column({ type: 'jsonb' })
  data: LabResultData;

  @Column({ type: 'jsonb', nullable: true })
  flags: LabResultFlags | null;

  @Column({ type: 'uuid' })
  recordedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;
}
