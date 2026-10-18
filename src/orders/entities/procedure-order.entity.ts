import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import type {
  LabResultData,
  LabResultFlags,
} from 'src/lab/results/result-schema.types';
import { Patient } from 'src/patients/entities/patient.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import { OrderKind } from '../enums/order-kind.enum';
import { OrderPriority } from '../enums/order-priority.enum';
import { OrderStatus } from '../enums/order-status.enum';
import { ResultClassification } from '../enums/result-classification.enum';
import { ProcedureTest } from './procedure-test.entity';

@Entity('procedure_orders')
export class ProcedureOrder extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  visitId: string | null;

  @ManyToOne(() => Visit, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'visitId' })
  visit: Visit | null;

  @Column({ type: 'uuid', nullable: true })
  consultationId: string | null;

  @ManyToOne(() => Consultation, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'consultationId' })
  consultation: Consultation | null;

  @Column({ type: 'uuid' })
  orderedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderedById' })
  orderedBy: User;

  @Index()
  @Column({ type: 'enum', enum: OrderKind })
  kind: OrderKind;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'uuid' })
  testId: string;

  @ManyToOne(() => ProcedureTest, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'testId' })
  test: ProcedureTest;

  @Column({ type: 'enum', enum: OrderPriority, default: OrderPriority.ROUTINE })
  priority: OrderPriority;

  @Index()
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.REQUESTED })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  indication: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledFor: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  resultData: LabResultData | null;

  @Column({ type: 'jsonb', nullable: true })
  resultFlags: LabResultFlags | null;

  @Column({ type: 'enum', enum: ResultClassification, nullable: true })
  classification: ResultClassification | null;

  @Column({ type: 'text', nullable: true })
  impression: string | null;

  @Column({ type: 'text', nullable: true })
  report: string | null;

  @Column({ type: 'uuid', nullable: true })
  performedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedById' })
  performedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason: string | null;
}
