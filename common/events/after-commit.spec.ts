import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { DataSource } from 'typeorm';
import { commitThenEmit } from './after-commit';

const emitter = { emit: jest.fn() };
const manager = {};
const dataSource = {
  transaction: jest.fn((work: (m: unknown) => Promise<unknown>) =>
    work(manager),
  ),
};

describe('commitThenEmit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits events and runs tasks only after the transaction resolves, in order', async () => {
    // Arrange
    const order: string[] = [];
    emitter.emit.mockImplementation((name: string) =>
      order.push(`emit:${name}`),
    );
    const task = jest.fn(() => {
      order.push('task');
      return Promise.resolve();
    });

    // Act
    const result = await commitThenEmit(
      dataSource as unknown as DataSource,
      emitter as unknown as EventEmitter2,
      (_m, after) => {
        after.emit('a', {});
        after.run(task);
        after.emit('b', {});
        order.push('work');
        return Promise.resolve(42);
      },
    );

    // Assert
    expect(result).toBe(42);
    expect(order).toEqual(['work', 'emit:a', 'task', 'emit:b']);
  });

  it('emits nothing when the transaction fails', async () => {
    // Arrange
    const failing = (
      _m: unknown,
      after: { emit: (n: string, p: object) => void },
    ) => {
      after.emit('never', {});
      return Promise.reject(new Error('rollback'));
    };

    // Act
    const run = commitThenEmit(
      dataSource as unknown as DataSource,
      emitter as unknown as EventEmitter2,
      failing,
    );

    // Assert
    await expect(run).rejects.toThrow('rollback');
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
