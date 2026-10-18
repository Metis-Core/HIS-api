import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';

/** A doctor's decision to admit a patient to a ward (D6). Beds and discharge come later. */
@Entity('admissions')
@Index(['visitId'], {
  unique: true,
  where: '"visitId" IS NOT NULL AND "deletedAt" IS NULL',
})
export class Admission extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'uuid', nullable: true })
  visitId: string | null;

  @ManyToOne(() => Visit, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'visitId' })
  visit: Visit | null;

  @Column({ type: 'uuid', nullable: true })
  consultationId: string | null;

  @ManyToOne(() => Consultation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'consultationId' })
  consultation: Consultation | null;

  @Column({ type: 'varchar', length: 100 })
  ward: string;

  @Column({ type: 'text' })
  reason: string;

  @Index()
  @Column({ type: 'timestamptz' })
  admittedAt: Date;

  @Column({ type: 'uuid' })
  admittedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admittedById' })
  admittedBy: User;
}
