import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Consultation } from './consultation.entity';

/** A dated note appended to a signed consultation; the signed record itself never changes (M-10). */
@Entity('consultation_addenda')
export class ConsultationAddendum extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  consultationId: string;

  @ManyToOne(() => Consultation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'consultationId' })
  consultation: Consultation;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text' })
  body: string;
}
