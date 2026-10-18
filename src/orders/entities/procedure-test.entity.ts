import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import type { LabResultSchema } from 'src/lab/results/result-schema.types';
import { OrderKind } from '../enums/order-kind.enum';
import { ProcedureCategory } from '../enums/procedure-category.enum';

@Entity('procedure_tests')
export class ProcedureTest extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  abbreviation: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'enum', enum: OrderKind })
  kind: OrderKind;

  @Column({
    type: 'enum',
    enum: ProcedureCategory,
    default: ProcedureCategory.OTHER,
  })
  category: ProcedureCategory;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  preparation: string | null;

  @Column({ type: 'jsonb', nullable: true })
  resultSchema: LabResultSchema | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
