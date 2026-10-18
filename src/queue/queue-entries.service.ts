import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { DEFAULT_PRIORITY } from './journey/visit-priority';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { VisitIntenentsEnum } from './enums/visit-type.enum';
import {
  QueueEntryCalledEvent,
  QueueEntryCompletedEvent,
  QueueEntryCreatedEvent,
  QueueEntryStartedEvent,
} from './events/queue.events';
import { intentDepartmentMap } from './intent-department.map';
import { canActOnStage } from './journey/department-access.policy';
import { PlannedStage, planDoctorRouting } from './journey/routing-plan';
import { assertTransition } from './queue-state-machine';

const OPEN_STATUSES: readonly QueueEntryStatus[] = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];

/** The signed-in user acting on a queue entry; omitted for system-driven transitions. */
export interface StageActor {
  id: string;
  role: UserRole;
}

@Injectable()
export class QueueEntriesService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly entries: Repository<QueueEntry>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly events: EventEmitter2,
  ) {}

  async findByDepartment(
    department: Department,
    statuses: QueueEntryStatus[] = [...OPEN_STATUSES],
    doctorId?: string,
  ): Promise<QueueEntry[]> {
    const query = this.entries
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .leftJoinAndSelect('visit.patient', 'patient')
      .leftJoinAndSelect('visit.assignedDoctor', 'assignedDoctor')
      .leftJoinAndSelect('entry.servedBy', 'servedBy')
      .where('entry.department = :department', { department })
      .andWhere('entry.status IN (:...statuses)', { statuses });
    if (doctorId) {
      query.andWhere(
        new Brackets((mine) =>
          mine
            .where('visit.assignedDoctorId = :doctorId', { doctorId })
            .orWhere(
              `visit.assignedDoctorId IS NULL AND NOT EXISTS (
              SELECT 1 FROM "queue_entries" earlier
              WHERE earlier."visitId" = entry."visitId"
                AND earlier."deletedAt" IS NULL
                AND earlier."sequenceNumber" < entry."sequenceNumber"
                AND earlier."status" IN (:...open))`,
              { open: OPEN_STATUSES },
            ),
        ),
      );
    }
    return query
      .orderBy('entry.priority', 'DESC')
      .addOrderBy('entry.createdAt', 'ASC')
      .getMany();
  }

  async findOpenEntryForPatient(
    patientId: string,
    department: Department,
  ): Promise<QueueEntry | null> {
    return this.entries.findOne({
      where: {
        department,
        status: In(OPEN_STATUSES as QueueEntryStatus[]),
        visit: { patientId },
      },
      order: { createdAt: 'DESC' },
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

  private async findOneForActor(
    id: string,
    actor?: StageActor,
  ): Promise<QueueEntry> {
    const entry = await this.findOneOrFail(id);
    if (actor && !canActOnStage(actor.role, entry.department)) {
      throw new ForbiddenException(
        `Role '${actor.role}' cannot act on the ${entry.department} queue`,
      );
    }
    return entry;
  }

  async call(id: string, actor: StageActor): Promise<QueueEntry> {
    const entry = await this.findOneForActor(id, actor);
    const userId = actor.id;
    assertTransition(entry.status, QueueEntryStatus.CALLED);
    entry.status = QueueEntryStatus.CALLED;
    entry.calledAt = new Date();
    entry.servedById = userId;
    await this.entries.save(entry);
    this.emit(QueueEntryCalledEvent, entry);
    return entry;
  }

  async start(id: string, actor: StageActor): Promise<QueueEntry> {
    const entry = await this.findOneForActor(id, actor);
    const userId = actor.id;
    assertTransition(entry.status, QueueEntryStatus.IN_SERVICE);
    entry.status = QueueEntryStatus.IN_SERVICE;
    entry.startedAt = new Date();
    entry.servedById = userId;
    await this.entries.save(entry);
    this.emit(QueueEntryStartedEvent, entry);
    return entry;
  }

  async complete(
    id: string,
    notes?: string,
    actor?: StageActor,
  ): Promise<{ entry: QueueEntry; next: QueueEntry | null }> {
    const entry = await this.findOneForActor(id, actor);
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

  async skip(
    id: string,
    notes?: string,
    actor?: StageActor,
  ): Promise<{ entry: QueueEntry; next: QueueEntry | null }> {
    const entry = await this.findOneForActor(id, actor);
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
    return this.appendStages(
      visitId,
      (intents ?? []).map((intent) => ({ intent })),
    );
  }

  /** Queues the doctor's requested stages in journey order (diagnostics, review, treatment, billing). */
  async routeFromDoctor(
    visitId: string,
    requested: VisitIntenentsEnum[],
    completingDepartment?: Department,
  ): Promise<QueueEntry[]> {
    const open = await this.entries.find({
      where: { visitId, status: In(OPEN_STATUSES as QueueEntryStatus[]) },
      order: { sequenceNumber: 'ASC' },
    });
    const current = completingDepartment
      ? open.find((entry) => entry.department === completingDepartment)
      : undefined;
    const openDepartments = open
      .filter((entry) => entry.id !== current?.id)
      .map((entry) => entry.department);
    return this.appendStages(
      visitId,
      planDoctorRouting(requested, openDepartments),
    );
  }

  private async appendStages(
    visitId: string,
    stages: PlannedStage[],
  ): Promise<QueueEntry[]> {
    if (stages.length === 0) return [];
    const existing = await this.entries.find({
      where: { visitId },
      order: { sequenceNumber: 'DESC' },
      take: 1,
    });
    const startSeq = (existing[0]?.sequenceNumber ?? 0) + 1;
    const visit = await this.visits.findOne({
      where: { id: visitId },
      select: { id: true, priority: true },
    });
    const priority = visit?.priority ?? DEFAULT_PRIORITY;
    const rows = stages.map((stage, i) =>
      this.entries.create({
        visitId,
        department: intentDepartmentMap[stage.intent],
        status: QueueEntryStatus.WAITING,
        priority,
        sequenceNumber: startSeq + i,
        metadata: stage.review ? { review: true } : null,
      }),
    );
    const saved = await this.entries.save(rows);
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
    ctor:
      | typeof QueueEntryCalledEvent
      | typeof QueueEntryStartedEvent
      | typeof QueueEntryCompletedEvent,
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
