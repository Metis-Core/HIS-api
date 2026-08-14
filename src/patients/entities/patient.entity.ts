import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Gender } from 'common/enums/gender.enum';
import { User } from 'src/users/entities/user.entity';
import { Contact } from 'src/contacts/entities/contact.entity';
import { BloodType } from 'src/patients/enums/blood-type.enum';
import { MaritalStatus } from 'src/patients/enums/marital-status.enum';
import { PatientStatus } from 'src/patients/enums/patient-status.enum';
import { PatientType } from 'src/patients/enums/patient-type.enum';

@Entity('patients')
export class Patient extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  mrn: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.UNKNOWN })
  gender: Gender;

  @Column({ type: 'enum', enum: BloodType, default: BloodType.UNKNOWN })
  bloodType: BloodType;

  @Column({ type: 'enum', enum: MaritalStatus, default: MaritalStatus.UNKNOWN })
  maritalStatus: MaritalStatus;

  @Column({ type: 'enum', enum: PatientStatus, default: PatientStatus.ACTIVE })
  status: PatientStatus;

  @Column({
    type: 'enum',
    enum: PatientType,
    default: PatientType.OUTPATIENT,
  })
  type: PatientType;

  @Index()
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  nationalId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  insuranceProvider: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurancePolicyNumber: string | null;

  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Index({ unique: true })
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @OneToOne(() => Contact, (contact) => contact.patient, {
    cascade: true,
    nullable: true,
  })
  contact: Contact | null;
}
