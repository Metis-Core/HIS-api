import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  EntityMetadata,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  ObjectLiteral,
  RecoverEvent,
  RemoveEvent,
  SoftRemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { RequestContext } from 'core/request-context/request-context';
import { diff, snapshot } from './audit-diff';
import { AUDITED_ENTITIES } from './audited-entities';
import { AuditChanges, AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';

const columnsOf = (metadata: EntityMetadata): string[] =>
  metadata.columns.map((column) => column.propertyName);

const idOf = (entity: ObjectLiteral | undefined): string | undefined =>
  entity?.id !== undefined ? String(entity.id) : undefined;

// Writes the audit row in the same transaction as the change, so neither can exist without the other.
@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<ObjectLiteral>): Promise<void> {
    await this.record(
      event.manager,
      event.metadata,
      idOf(event.entity),
      AuditAction.CREATE,
      {
        after: snapshot(event.entity, columnsOf(event.metadata)),
      },
    );
  }

  async afterUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void> {
    // Query-builder updates carry no row identity; audited services save entities instead.
    if (!event.entity || !event.databaseEntity) return;
    const keys = event.updatedColumns.map((column) => column.propertyName);
    const changes = diff(event.databaseEntity, event.entity, keys);
    if (!changes) return;
    await this.record(
      event.manager,
      event.metadata,
      idOf(event.databaseEntity),
      AuditAction.UPDATE,
      changes,
    );
  }

  async afterSoftRemove(event: SoftRemoveEvent<ObjectLiteral>): Promise<void> {
    const entity = event.databaseEntity ?? event.entity;
    await this.record(
      event.manager,
      event.metadata,
      idOf(entity),
      AuditAction.SOFT_DELETE,
      {
        before: snapshot(entity, columnsOf(event.metadata)),
      },
    );
  }

  async afterRecover(event: RecoverEvent<ObjectLiteral>): Promise<void> {
    const entity = event.databaseEntity ?? event.entity;
    await this.record(
      event.manager,
      event.metadata,
      idOf(entity),
      AuditAction.RESTORE,
      null,
    );
  }

  async afterRemove(event: RemoveEvent<ObjectLiteral>): Promise<void> {
    const entity = event.databaseEntity ?? event.entity;
    const id =
      event.entityId !== undefined ? String(event.entityId) : idOf(entity);
    await this.record(event.manager, event.metadata, id, AuditAction.DELETE, {
      before: snapshot(entity, columnsOf(event.metadata)),
    });
  }

  private async record(
    manager: EntityManager,
    metadata: EntityMetadata,
    entityId: string | undefined,
    action: AuditAction,
    changes: AuditChanges | null,
  ): Promise<void> {
    const entityType = AUDITED_ENTITIES.get(metadata.target);
    if (!entityType || !entityId) return;
    const repository = manager.getRepository(AuditLog);
    await repository.save(
      repository.create({
        entityType,
        entityId,
        action,
        changes,
        actorId: RequestContext.getCurrentUserId() ?? null,
        correlationId: RequestContext.getCorrelationId() ?? null,
      }),
    );
  }
}
