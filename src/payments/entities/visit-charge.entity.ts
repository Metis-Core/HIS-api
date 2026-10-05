import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { User } from 'src/users/entities/user.entity';
import { ChargeSource, ChargeStatus } from '../enums/charge.enum';

@Entity('visit_charges')
export class VisitCharge extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  visitId: string;

  @ManyToOne(() => Visit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visitId' })
  visit: Visit;

  @Column({ type: 'enum', enum: ChargeSource })
  source: ChargeSource;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int' })
  unitPrice: number;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'enum', enum: ChargeStatus, default: ChargeStatus.PENDING })
  status: ChargeStatus;

  @Column({ type: 'uuid', nullable: true })
  addedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'addedById' })
  addedBy: User | null;
}
