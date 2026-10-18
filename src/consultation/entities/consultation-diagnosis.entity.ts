import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { DiagnosisCode } from 'src/diagnoses/entities/diagnosis-code.entity';
import { Consultation } from './consultation.entity';

/** A coded diagnosis on a consultation; code and title are copied so the record survives catalogue updates. */
@Entity('consultation_diagnoses')
@Index(['consultationId', 'system', 'code'], { unique: true })
export class ConsultationDiagnosis extends BaseEntity {
  @Column({ type: 'uuid' })
  consultationId: string;

  @ManyToOne(() => Consultation, (c) => c.diagnoses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultationId' })
  consultation: Consultation;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  diagnosisCodeId: string | null;

  @ManyToOne(() => DiagnosisCode, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'diagnosisCodeId' })
  diagnosisCode: DiagnosisCode | null;

  @Column({ type: 'varchar', length: 16 })
  system: string;

  @Column({ type: 'varchar', length: 16 })
  code: string;

  // Null only for codes carried over from the old free-text field that matched no catalogue entry.
  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'int', default: 0 })
  rank: number;
}
