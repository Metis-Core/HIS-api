import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { PatientsService } from 'src/patients/patients.service';
import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { CheckInVisitDto } from './dto/check-in-visit.dto';
import { CompleteQueueStageDto } from './dto/complete-queue-stage.dto';
import { QueryQueueDto } from './dto/query-queue.dto';
import { TransferQueueEntryDto } from './dto/transfer-queue-entry.dto';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { VisitStatus } from './enums/visit-status.enum';
import { VisitType } from './enums/visit-type.enum';
import { assertTransition } from './queue-state-machine';
import {
  QueueEntryCalledEvent,
  QueueEntryCompletedEvent,
  QueueEntryCreatedEvent,
  QueueEntrySkippedEvent,
  QueueEntryStartedEvent,
  QueueEntryTransferredEvent,
  QueueEvent,
  toQueueEventData,
} from './events/queue.events';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitsRepository: Repository<Visit>,
    @InjectRepository(QueueEntry)
    private readonly queueEntriesRepository: Repository<QueueEntry>,
    private readonly patientsService: PatientsService,
    private readonly events: EventEmitter2,
  ) {}

  private emit(event: QueueEvent): void {
    this.events.emit(event.channel, event);
  }

  async checkIn(
    dto: CheckInVisitDto,
    checkedInById: string,
  ): Promise<{ visit: Visit; queueEntry: QueueEntry }> {
    await this.patientsService.findOne(dto.patientId);

    const serviceDate = this.today();
    const openVisit = await this.visitsRepository.findOne({
      where: {
        patientId: dto.patientId,
        serviceDate,
        status: In([VisitStatus.OPEN, VisitStatus.IN_PROGRESS]),
      },
    });
    if (openVisit) {
      throw new ConflictException(
        'Patient already has an open visit today. Complete or cancel it first.',
      );
    }

    const visitType = dto.visitType ?? VisitType.WALK_IN;
    const startDepartment = dto.department ?? Department.TRIAGE;
    const priority =
      visitType === VisitType.EMERGENCY ? 1 : visitType === VisitType.APPOINTMENT ? 4 : 5;
    const tokenNumber = await this.generateToken(visitType, serviceDate);
    const now = new Date();

    const visit = await this.visitsRepository.save(
      this.visitsRepository.create({
        patientId: dto.patientId,
        tokenNumber,
        serviceDate,
        visitType,
        status: VisitStatus.OPEN,
        currentDepartment: startDepartment,
        priority,
        triageId: null,
        checkedInById,
        checkedInAt: now,
        completedAt: null,
      }),
    );

    const queueEntry = await this.enqueue(
      visit,
      startDepartment,
      dto.notes ?? null,
    );

    return {
      visit: await this.findVisit(visit.id),
      queueEntry: await this.findQueueEntry(queueEntry.id),
    };
  }

  async getDepartmentQueue(
    department: Department,
    status: QueueEntryStatus = QueueEntryStatus.WAITING,
  ): Promise<QueueEntry[]> {
    return this.queueEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .leftJoinAndSelect('visit.patient', 'patient')
      .where('entry.department = :department', { department })
      .andWhere('entry.status = :status', { status })
      .andWhere('visit.serviceDate = :serviceDate', {
        serviceDate: this.today(),
      })
      .orderBy('entry.priority', 'ASC')
      .addOrderBy('entry.sequenceNumber', 'ASC')
      .getMany();
  }

  async getDisplayBoard(department: Department): Promise<
    Array<{
      tokenNumber: string;
      status: QueueEntryStatus;
      priority: number;
      sequenceNumber: number;
      calledAt: Date | null;
    }>
  > {
    const entries = await this.queueEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .where('entry.department = :department', { department })
      .andWhere('entry.status IN (:...statuses)', {
        statuses: [
          QueueEntryStatus.WAITING,
          QueueEntryStatus.CALLED,
          QueueEntryStatus.IN_SERVICE,
        ],
      })
      .andWhere('visit.serviceDate = :serviceDate', {
        serviceDate: this.today(),
      })
      .orderBy('entry.priority', 'ASC')
      .addOrderBy('entry.sequenceNumber', 'ASC')
      .getMany();

    return entries.map((entry) => ({
      tokenNumber: entry.visit.tokenNumber,
      status: entry.status,
      priority: entry.priority,
      sequenceNumber: entry.sequenceNumber,
      calledAt: entry.calledAt,
    }));
  }

  async findQueueEntries(query: QueryQueueDto): Promise<{
    data: QueueEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.queueEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .leftJoinAndSelect('visit.patient', 'patient');

    if (query.department) {
      qb.andWhere('entry.department = :department', {
        department: query.department,
      });
    }
    if (query.status) {
      qb.andWhere('entry.status = :status', { status: query.status });
    }
    if (query.patientId) {
      qb.andWhere('visit.patientId = :patientId', {
        patientId: query.patientId,
      });
    }
    if (query.visitId) {
      qb.andWhere('entry.visitId = :visitId', { visitId: query.visitId });
    }
    if (query.visitType) {
      qb.andWhere('visit.visitType = :visitType', {
        visitType: query.visitType,
      });
    }
    if (query.visitStatus) {
      qb.andWhere('visit.status = :visitStatus', {
        visitStatus: query.visitStatus,
      });
    }
    qb.andWhere('visit.serviceDate = :serviceDate', {
      serviceDate: query.serviceDate ?? this.today(),
    });

    qb.orderBy('entry.priority', 'ASC')
      .addOrderBy('entry.sequenceNumber', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findVisit(id: string): Promise<Visit> {
    const visit = await this.visitsRepository.findOne({
      where: { id },
      relations: { patient: true, checkedInBy: true, queueEntries: true },
    });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    return visit;
  }

  async findQueueEntry(id: string): Promise<QueueEntry> {
    const entry = await this.queueEntriesRepository.findOne({
      where: { id },
      relations: { visit: { patient: true }, servedBy: true },
    });
    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }
    return entry;
  }

  async callNext(
    department: Department,
    servedById: string,
  ): Promise<QueueEntry> {
    const next = await this.queueEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .leftJoinAndSelect('visit.patient', 'patient')
      .where('entry.department = :department', { department })
      .andWhere('entry.status = :status', {
        status: QueueEntryStatus.WAITING,
      })
      .andWhere('visit.serviceDate = :serviceDate', {
        serviceDate: this.today(),
      })
      .orderBy('entry.priority', 'ASC')
      .addOrderBy('entry.sequenceNumber', 'ASC')
      .getOne();

    if (!next) {
      throw new NotFoundException('No patients waiting in this queue');
    }

    next.status = QueueEntryStatus.CALLED;
    next.calledAt = new Date();
    next.servedById = servedById;
    await this.queueEntriesRepository.save(next);

    const visit = await this.findVisit(next.visitId);
    visit.status = VisitStatus.IN_PROGRESS;
    visit.currentDepartment = department;
    await this.visitsRepository.save(visit);

    this.emit(new QueueEntryCalledEvent(toQueueEventData(next, visit)));
    return this.findQueueEntry(next.id);
  }

  async startService(entryId: string, servedById: string): Promise<QueueEntry> {
    const entry = await this.findQueueEntry(entryId);
    assertTransition(entry.status, QueueEntryStatus.IN_SERVICE);

    entry.status = QueueEntryStatus.IN_SERVICE;
    entry.startedAt = new Date();
    entry.servedById = servedById;
    entry.calledAt = entry.calledAt ?? new Date();
    await this.queueEntriesRepository.save(entry);

    const visit = await this.findVisit(entry.visitId);
    visit.status = VisitStatus.IN_PROGRESS;
    visit.currentDepartment = entry.department;
    await this.visitsRepository.save(visit);

    this.emit(new QueueEntryStartedEvent(toQueueEventData(entry, visit)));
    return this.findQueueEntry(entry.id);
  }

  async completeStage(
    entryId: string,
    dto: CompleteQueueStageDto,
    servedById: string,
  ): Promise<{ entry: QueueEntry; visit: Visit; nextEntry: QueueEntry | null }> {
    const entry = await this.findQueueEntry(entryId);
    assertTransition(entry.status, QueueEntryStatus.COMPLETED);

    const now = new Date();
    entry.status = QueueEntryStatus.COMPLETED;
    entry.completedAt = now;
    entry.servedById = entry.servedById ?? servedById;
    entry.startedAt = entry.startedAt ?? now;
    if (dto.notes) {
      entry.notes = dto.notes;
    }
    await this.queueEntriesRepository.save(entry);

    const visit = await this.findVisit(entry.visitId);
    if (dto.triageId) {
      visit.triageId = dto.triageId;
    }

    let nextEntry: QueueEntry | null = null;
    if (dto.nextDepartment) {
      visit.currentDepartment = dto.nextDepartment;
      visit.status = VisitStatus.IN_PROGRESS;
      nextEntry = await this.enqueue(visit, dto.nextDepartment, null);
    } else {
      visit.status = VisitStatus.COMPLETED;
      visit.completedAt = now;
    }
    await this.visitsRepository.save(visit);

    this.emit(new QueueEntryCompletedEvent(toQueueEventData(entry, visit)));
    return {
      entry: await this.findQueueEntry(entry.id),
      visit: await this.findVisit(visit.id),
      nextEntry: nextEntry ? await this.findQueueEntry(nextEntry.id) : null,
    };
  }

  async skip(entryId: string, notes?: string): Promise<QueueEntry> {
    const entry = await this.findQueueEntry(entryId);
    assertTransition(entry.status, QueueEntryStatus.SKIPPED);
    entry.status = QueueEntryStatus.SKIPPED;
    entry.completedAt = new Date();
    entry.notes = notes ?? entry.notes;
    await this.queueEntriesRepository.save(entry);

    const visit = await this.findVisit(entry.visitId);
    this.emit(new QueueEntrySkippedEvent(toQueueEventData(entry, visit)));
    return this.findQueueEntry(entry.id);
  }

  async transfer(
    entryId: string,
    dto: TransferQueueEntryDto,
    servedById: string,
  ): Promise<{ entry: QueueEntry; visit: Visit; nextEntry: QueueEntry }> {
    const entry = await this.findQueueEntry(entryId);
    assertTransition(entry.status, QueueEntryStatus.TRANSFERRED);
    if (dto.nextDepartment === entry.department) {
      throw new BadRequestException(
        'Target department must differ from the current department',
      );
    }

    const now = new Date();
    entry.status = QueueEntryStatus.TRANSFERRED;
    entry.completedAt = now;
    entry.servedById = entry.servedById ?? servedById;
    if (dto.notes) {
      entry.notes = dto.notes;
    }
    await this.queueEntriesRepository.save(entry);

    const visit = await this.findVisit(entry.visitId);
    visit.status = VisitStatus.IN_PROGRESS;
    visit.currentDepartment = dto.nextDepartment;
    await this.visitsRepository.save(visit);

    const nextEntry = await this.enqueue(visit, dto.nextDepartment, null);

    this.emit(new QueueEntryTransferredEvent(toQueueEventData(entry, visit)));
    return {
      entry: await this.findQueueEntry(entry.id),
      visit: await this.findVisit(visit.id),
      nextEntry: await this.findQueueEntry(nextEntry.id),
    };
  }

  async linkTriage(visitId: string, triageId: string): Promise<Visit> {
    const visit = await this.findVisit(visitId);
    visit.triageId = triageId;
    await this.visitsRepository.save(visit);
    return this.findVisit(visitId);
  }

  async findByTriageId(triageId: string): Promise<Visit | null> {
    return this.visitsRepository.findOne({
      where: { triageId },
      relations: { patient: true, queueEntries: true },
    });
  }

  async applyTriagePriority(
    visitId: string,
    acuity: TriageAcuity,
    triageId: string,
    nextDepartment: Department = Department.OUTPATIENT_CLINIC,
  ): Promise<Visit> {
    const visit = await this.findVisit(visitId);
    visit.priority = this.acuityToPriority(acuity);
    visit.triageId = triageId;
    visit.currentDepartment = nextDepartment;
    visit.status = VisitStatus.IN_PROGRESS;
    await this.visitsRepository.save(visit);

    const activeTriageEntry = await this.queueEntriesRepository.findOne({
      where: {
        visitId,
        department: Department.TRIAGE,
        status: In([
          QueueEntryStatus.WAITING,
          QueueEntryStatus.CALLED,
          QueueEntryStatus.IN_SERVICE,
        ]),
      },
    });

    if (activeTriageEntry) {
      activeTriageEntry.status = QueueEntryStatus.COMPLETED;
      activeTriageEntry.completedAt = new Date();
      activeTriageEntry.priority = visit.priority;
      await this.queueEntriesRepository.save(activeTriageEntry);
      this.emit(
        new QueueEntryCompletedEvent(toQueueEventData(activeTriageEntry, visit)),
      );
    }

    const existingNext = await this.queueEntriesRepository.findOne({
      where: {
        visitId,
        department: nextDepartment,
        status: In([
          QueueEntryStatus.WAITING,
          QueueEntryStatus.CALLED,
          QueueEntryStatus.IN_SERVICE,
        ]),
      },
    });
    if (!existingNext) {
      await this.enqueue(visit, nextDepartment, null);
    } else {
      existingNext.priority = visit.priority;
      await this.queueEntriesRepository.save(existingNext);
    }

    return this.findVisit(visitId);
  }

  async updatePriority(visitId: string, priority: number): Promise<Visit> {
    const visit = await this.findVisit(visitId);
    visit.priority = priority;
    await this.visitsRepository.save(visit);

    await this.queueEntriesRepository.update(
      {
        visitId,
        status: In([
          QueueEntryStatus.WAITING,
          QueueEntryStatus.CALLED,
          QueueEntryStatus.IN_SERVICE,
        ]),
      },
      { priority },
    );

    return this.findVisit(visitId);
  }

  async cancelVisit(visitId: string): Promise<Visit> {
    const visit = await this.findVisit(visitId);
    visit.status = VisitStatus.CANCELLED;
    visit.completedAt = new Date();
    await this.visitsRepository.save(visit);

    const activeEntries = await this.queueEntriesRepository.find({
      where: {
        visitId,
        status: In([
          QueueEntryStatus.WAITING,
          QueueEntryStatus.CALLED,
          QueueEntryStatus.IN_SERVICE,
        ]),
      },
    });
    for (const entry of activeEntries) {
      entry.status = QueueEntryStatus.SKIPPED;
      entry.completedAt = new Date();
      await this.queueEntriesRepository.save(entry);
      this.emit(new QueueEntrySkippedEvent(toQueueEventData(entry, visit)));
    }

    return this.findVisit(visitId);
  }

  private async enqueue(
    visit: Visit,
    department: Department,
    notes: string | null,
  ): Promise<QueueEntry> {
    const sequenceNumber = await this.nextSequence(department, visit.serviceDate);
    const entry = await this.queueEntriesRepository.save(
      this.queueEntriesRepository.create({
        visitId: visit.id,
        department,
        status: QueueEntryStatus.WAITING,
        priority: visit.priority,
        sequenceNumber,
        servedById: null,
        calledAt: null,
        startedAt: null,
        completedAt: null,
        notes,
      }),
    );

    this.emit(new QueueEntryCreatedEvent(toQueueEventData(entry, visit)));
    return entry;
  }

  private async nextSequence(
    department: Department,
    serviceDate: string,
  ): Promise<number> {
    const result = await this.queueEntriesRepository
      .createQueryBuilder('entry')
      .leftJoin('entry.visit', 'visit')
      .select('COALESCE(MAX(entry.sequenceNumber), 0)', 'max')
      .where('entry.department = :department', { department })
      .andWhere('visit.serviceDate = :serviceDate', { serviceDate })
      .getRawOne<{ max: string }>();

    return Number(result?.max ?? 0) + 1;
  }

  private async generateToken(
    visitType: VisitType,
    serviceDate: string,
  ): Promise<string> {
    const prefix =
      visitType === VisitType.EMERGENCY
        ? 'E'
        : visitType === VisitType.APPOINTMENT
          ? 'A'
          : 'W';

    const count = await this.visitsRepository.count({
      where: { serviceDate, visitType },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private acuityToPriority(acuity: TriageAcuity): number {
    const map: Record<TriageAcuity, number> = {
      [TriageAcuity.LEVEL_1]: 1,
      [TriageAcuity.LEVEL_2]: 2,
      [TriageAcuity.LEVEL_3]: 3,
      [TriageAcuity.LEVEL_4]: 4,
      [TriageAcuity.LEVEL_5]: 5,
    };
    return map[acuity];
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
