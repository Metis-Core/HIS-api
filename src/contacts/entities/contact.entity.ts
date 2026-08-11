import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Patient } from 'src/patients/entities/patient.entity';

@Entity('contacts')
export class Contact extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relationship: string | null;

  @OneToOne(() => Patient, (patient) => patient.contact, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  patientId: string;
}
