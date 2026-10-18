import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { DiagnosisCodeSystem } from '../enums/diagnosis-code-system.enum';

/** One entry of a diagnosis classification (ICD-10, ICD-10-CM or ICD-11). */
@Entity('diagnosis_codes')
@Index(['system', 'code'], { unique: true })
export class DiagnosisCode extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  system: DiagnosisCodeSystem;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;
}
