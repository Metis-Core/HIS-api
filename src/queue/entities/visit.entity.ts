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
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';

@Entity('visits')
export class Visit extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'enum', enum: VisitTypeEnum, default: VisitTypeEnum.WALK_IN })
  visitType: VisitTypeEnum;

  @Index()
  @Column({ type: 'enum', enum: VisitStatusEnum, default: VisitStatusEnum.OPEN })
  status: VisitStatusEnum;

  @Column({ type: 'uuid' })
  checkedInById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'checkedInById' })
  checkedInBy: User;

  @OneToMany(() => QueueEntry, (entry) => entry.visit)
  queueEntries: QueueEntry[];
}
