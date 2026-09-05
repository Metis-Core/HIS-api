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
import { Visit } from 'src/queue/entities/visit.entity';
import { LabOrderStatus } from '../enums/lab-order-status.enum';
import { LabPriority } from '../enums/lab-priority.enum';
import { LabOrderItem } from './lab-order-item.entity';

@Entity('lab_orders')
@Index(['patientId', 'status'])
export class LabOrder extends BaseEntity {
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

  @ManyToOne(() => Visit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'visitId' })
  visit: Visit | null;

  @Column({ type: 'uuid', nullable: true })
  visitId: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderedById' })
  orderedBy: User;

  @Column({ type: 'uuid' })
  orderedById: string;

  @Column({ type: 'enum', enum: LabOrderStatus, default: LabOrderStatus.PENDING })
  status: LabOrderStatus;

  @Column({ type: 'enum', enum: LabPriority, default: LabPriority.ROUTINE })
  priority: LabPriority;

  @Column({ type: 'varchar', length: 500, nullable: true })
  clinicalNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => LabOrderItem, (item) => item.order, {
    cascade: true,
    eager: false,
  })
  items: LabOrderItem[];
}
