import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Department } from 'common/enums/department.enum';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { Triage } from 'src/traige/entities/traige.entity';
import { VisitStatus } from 'src/queue/enums/visit-status.enum';
import { VisitType } from 'src/queue/enums/visit-type.enum';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';

@Entity('visits')
export class Visit extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  tokenNumber: string;

  @Column({ type: 'date' })
  serviceDate: string;

  @Column({ type: 'enum', enum: VisitType, default: VisitType.WALK_IN })
  visitType: VisitType;

  @Index()
  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.OPEN })
  status: VisitStatus;

  @Index()
  @Column({ type: 'enum', enum: Department, default: Department.TRIAGE })
  currentDepartment: Department;

  @Column({ type: 'int', default: 5 })
  priority: number;

  @Column({ type: 'uuid', nullable: true })
  triageId: string | null;

  @ManyToOne(() => Triage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'triageId' })
  triage: Triage | null;

  @Column({ type: 'uuid' })
  checkedInById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checkedInById' })
  checkedInBy: User;

  @Column({ type: 'timestamp' })
  checkedInAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => QueueEntry, (entry) => entry.visit)
  queueEntries: QueueEntry[];
}
