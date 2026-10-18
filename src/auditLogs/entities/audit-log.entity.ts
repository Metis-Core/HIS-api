import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { AuditAction } from '../enums/audit-action.enum';

// Append-only: a database trigger rejects UPDATE, DELETE and TRUNCATE on this table.
@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  entityType: string;

  @Column({ type: 'varchar', length: 64 })
  entityId: string;

  @Index()
  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  correlationId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  changes: AuditChanges | null;
}

export interface AuditChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
