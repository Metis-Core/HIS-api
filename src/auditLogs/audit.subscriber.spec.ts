import { DataSource } from 'typeorm';
import { RequestContext } from 'core/request-context/request-context';
import { User } from 'src/users/entities/user.entity';
import { AuditSubscriber } from './audit.subscriber';
import { AuditAction } from './enums/audit-action.enum';

describe('AuditSubscriber', () => {
  const repository = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn(),
  };
  const manager = { getRepository: jest.fn(() => repository) };
  const userMetadata = {
    target: User,
    columns: ['id', 'email', 'passwordHash'].map((propertyName) => ({
      propertyName,
    })),
  };
  let subscriber: AuditSubscriber;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriber = new AuditSubscriber({
      subscribers: [],
    } as unknown as DataSource);
  });

  it('records a create with the current actor and redacts secrets', async () => {
    // Arrange
    const event = {
      manager,
      metadata: userMetadata,
      entity: { id: 'u1', email: 'a@b.c', passwordHash: 'hash' },
    };

    // Act
    await RequestContext.run({ correlationId: 'c1', userId: 'actor-1' }, () =>
      subscriber.afterInsert(event as never),
    );

    // Assert
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'user',
        entityId: 'u1',
        action: AuditAction.CREATE,
        actorId: 'actor-1',
        correlationId: 'c1',
        changes: {
          after: { id: 'u1', email: 'a@b.c', passwordHash: '[redacted]' },
        },
      }),
    );
  });

  it('ignores entities that are not audited', async () => {
    // Arrange
    const event = {
      manager,
      metadata: { target: class Other {}, columns: [] },
      entity: { id: 'x' },
    };

    // Act
    await subscriber.afterInsert(event as never);

    // Assert
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('skips updates that carry no row identity (query-builder writes)', async () => {
    // Arrange
    const event = {
      manager,
      metadata: userMetadata,
      entity: { email: 'new@b.c' },
      databaseEntity: undefined,
      updatedColumns: [],
    };

    // Act
    await subscriber.afterUpdate(event as never);

    // Assert
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('records only the changed columns on update', async () => {
    // Arrange
    const event = {
      manager,
      metadata: userMetadata,
      entity: { id: 'u1', email: 'new@b.c' },
      databaseEntity: { id: 'u1', email: 'old@b.c' },
      updatedColumns: [{ propertyName: 'email' }],
    };

    // Act
    await subscriber.afterUpdate(event as never);

    // Assert
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        changes: { before: { email: 'old@b.c' }, after: { email: 'new@b.c' } },
      }),
    );
  });
});
