import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';
import { VisitStatusEnum } from 'src/queue/enums/visit-status.enum';
import { VisitTypeEnum } from 'src/queue/enums/visit-type.enum';
import { TriageCategory } from 'src/queue/enums/triage-category.enum';
import { AssignmentSource } from 'src/queue/enums/assignment-source.enum';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';

@Entity('visits')
export class Visit extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'enum', enum: VisitTypeEnum, default: VisitTypeEnum.WALK_IN })
  visitType: VisitTypeEnum;

  @Index()
  @Column({
    type: 'enum',
    enum: VisitStatusEnum,
    default: VisitStatusEnum.OPEN,
  })
  status: VisitStatusEnum;

  @Column({ type: 'enum', enum: TriageCategory, nullable: true })
  triageCategory: TriageCategory | null;

  /** EM-YYYYMMDD-NNN, issued at registration for emergency arrivals. */
  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  emergencyNumber: string | null;

  // Copied onto every queue entry of the visit so each department sorts by it.
  @Column({ type: 'int', default: 5 })
  priority: number;

  @Column({ type: 'uuid' })
  checkedInById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checkedInById' })
  checkedInBy: User;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedDoctorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedDoctorId' })
  assignedDoctor: User | null;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'enum', enum: AssignmentSource, nullable: true })
  assignmentSource: AssignmentSource | null;

  @OneToMany(() => QueueEntry, (entry) => entry.visit)
  queueEntries: QueueEntry[];
}
