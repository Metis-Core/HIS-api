import { Department } from 'common/enums/department.enum';
import { QueueEntry } from 'src/queue/entities/queue-entry.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { QueueEntryStatus } from 'src/queue/enums/queue-entry-status.enum';

export interface QueueEventData {
  readonly entryId: string;
  readonly visitId: string;
  readonly patientId: string;
  readonly department: Department;
  readonly tokenNumber: string;
  readonly status: QueueEntryStatus;
  readonly priority: number;
  readonly sequenceNumber: number;
  readonly servedById: string | null;
}

export abstract class QueueEvent {
  abstract readonly channel: string;
  readonly occurredAt = new Date();

  constructor(readonly data: QueueEventData) {}
}

export class QueueEntryCreatedEvent extends QueueEvent {
  static readonly channel = 'queue.entry.created';
  readonly channel = QueueEntryCreatedEvent.channel;
}

export class QueueEntryCalledEvent extends QueueEvent {
  static readonly channel = 'queue.entry.called';
  readonly channel = QueueEntryCalledEvent.channel;
}

export class QueueEntryStartedEvent extends QueueEvent {
  static readonly channel = 'queue.entry.started';
  readonly channel = QueueEntryStartedEvent.channel;
}

export class QueueEntryCompletedEvent extends QueueEvent {
  static readonly channel = 'queue.entry.completed';
  readonly channel = QueueEntryCompletedEvent.channel;
}

export class QueueEntryTransferredEvent extends QueueEvent {
  static readonly channel = 'queue.entry.transferred';
  readonly channel = QueueEntryTransferredEvent.channel;
}

export class QueueEntrySkippedEvent extends QueueEvent {
  static readonly channel = 'queue.entry.skipped';
  readonly channel = QueueEntrySkippedEvent.channel;
}

export const QUEUE_EVENT_PATTERN = 'queue.entry.*';

export function toQueueEventData(
  entry: QueueEntry,
  visit: Visit,
): QueueEventData {
  return {
    entryId: entry.id,
    visitId: visit.id,
    patientId: visit.patientId,
    department: entry.department,
    tokenNumber: visit.tokenNumber,
    status: entry.status,
    priority: entry.priority,
    sequenceNumber: entry.sequenceNumber,
    servedById: entry.servedById,
  };
}
