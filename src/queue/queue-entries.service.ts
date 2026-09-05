import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { QueueEntry } from './entities/queue-entry.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { VisitIntenentsEnum } from './enums/visit-type.enum';
import {
  QueueEntryCalledEvent,
  QueueEntryCompletedEvent,
  QueueEntryCreatedEvent,
  QueueEntryStartedEvent,
} from './events/queue.events';
import { intentDepartmentMap } from './intent-department.map';
import { assertTransition } from './queue-state-machine';

const OPEN_STATUSES: readonly QueueEntryStatus[] = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];

@Injectable()
export class QueueEntriesService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly entries: Repository<QueueEntry>,
    private readonly events: EventEmitter2,
  ) {}

  async findByDepartment(
    department: Department,
    statuses: QueueEntryStatus[] = [
      QueueEntryStatus.WAITING,
      QueueEntryStatus.CALLED,
      QueueEntryStatus.IN_SERVICE,
    ],
  ): Promise<QueueEntry[]> {
    return this.entries.find({
      where: { department, status: In(statuses) },
      relations: { visit: { patient: true }, servedBy: true },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findByVisit(visitId: string): Promise<QueueEntry[]> {
    return this.entries.find({
      where: { visitId },
      order: { sequenceNumber: 'ASC' },
      relations: { servedBy: true },
    });
  }

  async findOneOrFail(id: string): Promise<QueueEntry> {
    const entry = await this.entries.findOne({
      where: { id },
      relations: { visit: { patient: true } },
    });
    if (!entry) throw new NotFoundException('Queue entry not found');
    return entry;
  }

  async call(id: string, userId: string): Promise<QueueEntry> {
    const entry = await this.findOneOrFail(id);
    assertTransition(entry.status, QueueEntryStatus.CALLED);
    entry.status = QueueEntryStatus.CALLED;
    entry.calledAt = new Date();
    entry.servedById = userId;
    await this.entries.save(entry);
    this.emit(QueueEntryCalledEvent, entry);
    return entry;
  }

  async start(id: string, userId: string): Promise<QueueEntry> {
    const entry = await this.findOneOrFail(id);
    assertTransition(entry.status, QueueEntryStatus.IN_SERVICE);
    entry.status = QueueEntryStatus.IN_SERVICE;
    entry.startedAt = new Date();
    entry.servedById = userId;
    await this.entries.save(entry);
    this.emit(QueueEntryStartedEvent, entry);
    return entry;
  }

  async complete(id: string, notes?: string): Promise<{ entry: QueueEntry; next: QueueEntry | null }> {
    const entry = await this.findOneOrFail(id);
    if (entry.status !== QueueEntryStatus.COMPLETED) {
      assertTransition(entry.status, QueueEntryStatus.COMPLETED);
      entry.status = QueueEntryStatus.COMPLETED;
      entry.completedAt = new Date();
      if (notes) entry.notes = notes;
      await this.entries.save(entry);
      this.emit(QueueEntryCompletedEvent, entry);
    }
    const next = await this.advanceNext(entry);
    return { entry, next };
  }

  async skip(id: string, notes?: string): Promise<{ entry: QueueEntry; next: QueueEntry | null }> {
    const entry = await this.findOneOrFail(id);
    assertTransition(entry.status, QueueEntryStatus.SKIPPED);
    entry.status = QueueEntryStatus.SKIPPED;
    entry.completedAt = new Date();
    if (notes) entry.notes = notes;
    await this.entries.save(entry);
    const next = await this.advanceNext(entry);
    return { entry, next };
  }

  async remove(id: string): Promise<{ id: string; next: QueueEntry | null }> {
    const entry = await this.findOneOrFail(id);
    const next = await this.entries.findOne({
      where: { visitId: entry.visitId, status: QueueEntryStatus.WAITING },
      order: { sequenceNumber: 'ASC' },
    });
    await this.entries.delete(entry.id);
    let advanced: QueueEntry | null = null;
    if (next && entry.status !== QueueEntryStatus.COMPLETED) {
      next.status = QueueEntryStatus.CALLED;
      next.calledAt = new Date();
      advanced = await this.entries.save(next);
    }
    return { id, next: advanced };
  }

  async currentEntryForVisit(visitId: string): Promise<QueueEntry | null> {
    return this.entries.findOne({
      where: { visitId, status: In(OPEN_STATUSES as QueueEntryStatus[]) },
      order: { sequenceNumber: 'ASC' },
      relations: { visit: { patient: true } },
    });
  }

  async completeCurrentFor(
    visitId: string,
    department: Department,
  ): Promise<{ entry: QueueEntry; next: QueueEntry | null } | null> {
    const entry = await this.entries.findOne({
      where: {
        visitId,
        department,
        status: In(OPEN_STATUSES as QueueEntryStatus[]),
      },
      order: { sequenceNumber: 'ASC' },
    });
    if (!entry) return null;
    return this.complete(entry.id);
  }

  async appendIntents(
    visitId: string,
    intents: VisitIntenentsEnum[],
  ): Promise<QueueEntry[]> {
    if (!intents || intents.length === 0) return [];
    const existing = await this.entries.find({
      where: { visitId },
      order: { sequenceNumber: 'DESC' },
      take: 1,
    });
    const startSeq = (existing[0]?.sequenceNumber ?? 0) + 1;
    const rows = intents.map((intent, i) => ({
      visitId,
      department: intentDepartmentMap[intent],
      status: QueueEntryStatus.WAITING,
      priority: 5,
      sequenceNumber: startSeq + i,
    }));
    const saved = await this.entries.save(rows as QueueEntry[]);
    for (const s of saved) {
      this.events.emit(
        QueueEntryCreatedEvent.channel,
        new QueueEntryCreatedEvent({
          entryId: s.id,
          visitId: s.visitId,
          patientId: '',
          department: s.department,
          tokenNumber: '',
          status: s.status,
          priority: s.priority,
          sequenceNumber: s.sequenceNumber,
          servedById: s.servedById,
        }),
      );
    }
    return saved;
  }

  async ensureIntent(
    visitId: string | null | undefined,
    intent: VisitIntenentsEnum,
  ): Promise<QueueEntry | null> {
    if (!visitId) return null;
    const department = intentDepartmentMap[intent];
    const active = await this.entries.findOne({
      where: {
        visitId,
        department,
        status: In(OPEN_STATUSES as QueueEntryStatus[]),
      },
      order: { sequenceNumber: 'ASC' },
    });
    if (active) return active;
    const [created] = await this.appendIntents(visitId, [intent]);
    return created ?? null;
  }

  private async advanceNext(current: QueueEntry): Promise<QueueEntry | null> {
    const next = await this.entries.findOne({
      where: {
        visitId: current.visitId,
        status: QueueEntryStatus.WAITING,
      },
      order: { sequenceNumber: 'ASC' },
    });
    if (!next) return null;
    if (next.sequenceNumber <= current.sequenceNumber) return null;
    next.status = QueueEntryStatus.CALLED;
    next.calledAt = new Date();
    await this.entries.save(next);
    this.emit(QueueEntryCalledEvent, next);
    return next;
  }

  private emit(
    ctor: typeof QueueEntryCalledEvent | typeof QueueEntryStartedEvent | typeof QueueEntryCompletedEvent,
    entry: QueueEntry,
  ) {
    if (!entry.visit) return;
    const event = new ctor({
      entryId: entry.id,
      visitId: entry.visitId,
      patientId: entry.visit.patientId,
      department: entry.department,
      tokenNumber: '',
      status: entry.status,
      priority: entry.priority,
      sequenceNumber: entry.sequenceNumber,
      servedById: entry.servedById,
    });
    this.events.emit(event.channel, event);
    return event;
  }
}

export function isOpenStatus(status: QueueEntryStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
