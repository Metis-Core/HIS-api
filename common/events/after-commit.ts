import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { DataSource, EntityManager } from 'typeorm';

type AfterCommitStep =
  | { kind: 'event'; name: string; payload: object }
  | { kind: 'task'; task: () => Promise<unknown> };

/** Side effects raised inside a transaction; they run only once it has committed (H-12). */
export class AfterCommit {
  private readonly steps: AfterCommitStep[] = [];

  emit(name: string, payload: object): void {
    this.steps.push({ kind: 'event', name, payload });
  }

  run(task: () => Promise<unknown>): void {
    this.steps.push({ kind: 'task', task });
  }

  async flush(emitter: EventEmitter2): Promise<void> {
    for (const step of this.steps.splice(0)) {
      if (step.kind === 'event') emitter.emit(step.name, step.payload);
      else await step.task();
    }
  }
}

/** Runs `work` in a transaction, then emits its events and runs its follow-up tasks in order. */
export async function commitThenEmit<T>(
  dataSource: DataSource,
  emitter: EventEmitter2,
  work: (manager: EntityManager, after: AfterCommit) => Promise<T>,
): Promise<T> {
  const after = new AfterCommit();
  const result = await dataSource.transaction((manager) =>
    work(manager, after),
  );
  await after.flush(emitter);
  return result;
}
