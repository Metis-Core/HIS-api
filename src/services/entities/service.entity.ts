import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';

@Entity('services')
export class Service extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Column({ type: 'int' })
  fee: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
