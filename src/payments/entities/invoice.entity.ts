import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { InvoiceStatus } from '../enums/payment.enum';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  number: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  visitId: string;

  @ManyToOne(() => Visit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'visitId' })
  visit: Visit;

  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.UNPAID })
  status: InvoiceStatus;

  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'int', default: 0 })
  paid: number;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt: Date | null;
}
