import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { LabSampleType } from '../enums/lab-sample-type.enum';
import { LabTestCategory } from '../enums/lab-test-category.enum';

export type LabResultFieldType = 'number' | 'text' | 'select' | 'boolean';

export interface LabResultField {
  key: string;
  label: string;
  type: LabResultFieldType;
  unit?: string;
  referenceRange?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
}

export interface LabResultSchema {
  fields: LabResultField[];
}

@Entity('lab_tests')
export class LabTest extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: LabTestCategory, default: LabTestCategory.OTHER })
  category: LabTestCategory;

  @Column({ type: 'enum', enum: LabSampleType, default: LabSampleType.BLOOD })
  sampleType: LabSampleType;

  @Column({ type: 'varchar', length: 32, nullable: true })
  unit: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  referenceRange: string | null;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', nullable: true })
  turnaroundHours: number | null;

  @Column({ type: 'jsonb', nullable: true })
  resultSchema: LabResultSchema | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
