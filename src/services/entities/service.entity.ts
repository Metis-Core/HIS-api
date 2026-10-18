import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';

@Entity('services')
export class Service extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  // Stable lookup key (e.g. CONSULTATION) so renaming a service never breaks billing.
  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  code: string | null;

  @Column({ type: 'int' })
  fee: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
