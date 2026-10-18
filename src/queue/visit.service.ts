import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeepPartial, In, Like, QueryFailedError, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { PatientsService } from 'src/patients/patients.service';
import { UsersService } from 'src/users/users.service';
import { CreateVisitDTO } from './dto/create-visit.dto';
import { QueryVisitsDTO } from './dto/query-visits.dto';
import { IPagination } from 'common/response-format';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { intentDepartmentMap } from './intent-department.map';
import { VisitIntenentsEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
import { buildVisitTimeline, VisitTimeline } from './journey/visit-timeline';
import { TriageCategory } from './enums/triage-category.enum';
import { VisitTypeEnum } from './enums/visit-type.enum';
import {
  emergencyNumberPrefix,
  isMoreUrgent,
  nextEmergencyNumber,
  priorityFor,
  resolveCheckInCategory,
} from './journey/visit-priority';
import { isOpenStatus } from './queue-entries.service';

const UNIQUE_VIOLATION = '23505';
const EMERGENCY_NUMBER_ATTEMPTS = 3;
import { BaseCrudService } from '../../common/services/crud.service';

const CHECK_IN_INTENTS = [
  VisitIntenentsEnum.EXAMINATION,
  VisitIntenentsEnum.CONSULTATION,
];

@Injectable()
export class VisitsService extends BaseCrudService<Visit> {
  constructor(
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(QueueEntry)
    private readonly queueEntriesRepository: Repository<QueueEntry>,
    private readonly patientsService: PatientsService,
    private readonly usersService: UsersService,
    private readonly events: EventEmitter2,
  ) {
    super(visitsRepository);
  }

  override async create(
    entity: CreateVisitDTO & { handler: string },
  ): Promise<Visit> {
    const { patientId, visitType, insuranceVerification, handler } = entity;

    if (!handler) {
      throw new NotFoundException('Handler ID is required');
    }
    await this.usersService.findOne(handler);
    if (!patientId || !(await this.patientsService.findByStringId(patientId))) {
      throw new NotFoundException('Patient not found');
    }

    const triageCategory = resolveCheckInCategory(
      visitType,
      entity.triageCategory,
    );
    const visit = await this.saveWithEmergencyNumber(
      this.visitsRepository.create({
        patientId,
        checkedInById: handler,
        visitType,
        triageCategory,
        priority: priorityFor(triageCategory),
        metadata: {
          initialIntents: CHECK_IN_INTENTS,
          ...(insuranceVerification && {
            insuranceVerification: {
              ...insuranceVerification,
              verifiedById: handler,
              verifiedAt: new Date().toISOString(),
            },
          }),
        },
      }),
    );

    await this.queueEntriesRepository.save(this.checkInEntries(visit, handler));

    this.events.emit(
      VisitCheckedInEvent.channel,
      new VisitCheckedInEvent(visit.id, patientId, handler, CHECK_IN_INTENTS),
    );

    return visit;
  }

  // Two emergency check-ins in the same second can pick the same number; the unique index decides and we retry.
  private async saveWithEmergencyNumber(visit: Visit): Promise<Visit> {
    if (visit.visitType !== VisitTypeEnum.EMERGENCY) {
      return this.visitsRepository.save(visit);
    }
    for (let attempt = 1; ; attempt++) {
      const now = new Date();
      const last = await this.visitsRepository.findOne({
        where: { emergencyNumber: Like(`${emergencyNumberPrefix(now)}%`) },
        order: { emergencyNumber: 'DESC' },
        withDeleted: true,
      });
      visit.emergencyNumber = nextEmergencyNumber(
        now,
        last?.emergencyNumber ?? null,
      );
      try {
        return await this.visitsRepository.save(visit);
      } catch (error) {
        const duplicate =
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string })?.code === UNIQUE_VIOLATION;
        if (!duplicate || attempt >= EMERGENCY_NUMBER_ATTEMPTS) throw error;
      }
    }
  }

  /** Staff override of the triage colour, with a reason kept in metadata (and the audit log). */
  async changePriority(
    id: string,
    category: TriageCategory,
    reason: string,
    actorId: string,
  ): Promise<Visit> {
    const visit = await this.findByStringId(id);
    visit.metadata = {
      ...((visit.metadata ?? {}) as Record<string, unknown>),
      lastPriorityChange: {
        from: visit.triageCategory,
        to: category,
        reason: reason.trim(),
        byId: actorId,
        at: new Date().toISOString(),
      },
    };
    return this.applyCategory(visit, category);
  }

  /** Triage result: raises urgency automatically but never lowers it (lowering needs changePriority). */
  async raiseCategory(id: string, category: TriageCategory): Promise<Visit> {
    const visit = await this.findByStringId(id);
    if (!isMoreUrgent(category, visit.triageCategory)) return visit;
    return this.applyCategory(visit, category);
  }

  private async applyCategory(
    visit: Visit,
    category: TriageCategory,
  ): Promise<Visit> {
    visit.triageCategory = category;
    visit.priority = priorityFor(category);
    await this.visitsRepository.save(visit);
    const entries = await this.queueEntriesRepository.find({
      where: { visitId: visit.id },
    });
    const open = entries.filter((entry) => isOpenStatus(entry.status));
    if (open.length > 0) {
      await this.queueEntriesRepository.update(
        { id: In(open.map((entry) => entry.id)) },
        { priority: visit.priority },
      );
    }
    return visit;
  }

  /** Visit history, newest first; filters narrow it to one patient, status or visit type. */
  async search(query: QueryVisitsDTO): Promise<IPagination<Visit>> {
    const { patientId, status, visitType, sortOrder = 'DESC' } = query;
    return this.findPage(
      {
        where: {
          ...(patientId ? { patientId } : {}),
          ...(status ? { status } : {}),
          ...(visitType ? { visitType } : {}),
        },
        relations: { patient: true, queueEntries: true },
        order: { createdAt: sortOrder, id: sortOrder },
      },
      query,
    );
  }

  async timeline(id: string): Promise<VisitTimeline> {
    await this.findByStringId(id);
    const entries = await this.queueEntriesRepository.find({
      where: { visitId: id },
      relations: { servedBy: true },
    });
    return buildVisitTimeline(entries, new Date());
  }

  // Reception is recorded as a finished first stage so waits are measured from registration.
  private checkInEntries(visit: Visit, handler: string): QueueEntry[] {
    const now = new Date();
    const visitId = visit.id;
    const reception = this.queueEntriesRepository.create({
      visitId,
      department: Department.RECEPTION,
      status: QueueEntryStatus.COMPLETED,
      priority: visit.priority,
      sequenceNumber: 1,
      servedById: handler,
      calledAt: now,
      startedAt: now,
      completedAt: now,
    });
    const next = CHECK_IN_INTENTS.map((intent, index) =>
      this.queueEntriesRepository.create({
        visitId,
        department: intentDepartmentMap[intent],
        status: QueueEntryStatus.WAITING,
        priority: visit.priority,
        sequenceNumber: index + 2,
      }),
    );
    return [reception, ...next];
  }

  override async update(
    id: string,
    entity: DeepPartial<Visit>,
  ): Promise<Visit> {
    const existing = await this.findByStringId(id);
    const { metadata, ...rest } = entity as Omit<
      DeepPartial<Visit>,
      'metadata'
    > & {
      metadata?: Record<string, unknown>;
    };
    const current = (existing.metadata ?? {}) as Record<string, unknown>;
    this.visitsRepository.merge(existing, rest);
    existing.metadata = { ...current, ...(metadata ?? {}) };
    await this.visitsRepository.save(existing);
    return this.findByStringId(id);
  }
}
