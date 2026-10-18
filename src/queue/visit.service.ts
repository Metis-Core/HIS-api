import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeepPartial, Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { PatientsService } from 'src/patients/patients.service';
import { UsersService } from 'src/users/users.service';
import { CreateVisitDTO } from './dto/create-visit.dto';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { intentDepartmentMap } from './intent-department.map';
import { VisitIntenentsEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
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

    const visit = await this.visitsRepository.save({
      patientId,
      checkedInById: handler,
      visitType,
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
    });

    await this.queueEntriesRepository.save(
      this.checkInEntries(visit.id, handler),
    );

    this.events.emit(
      VisitCheckedInEvent.channel,
      new VisitCheckedInEvent(visit.id, patientId, handler),
    );

    return visit;
  }

  // Reception is recorded as a finished first stage so waits are measured from registration.
  private checkInEntries(visitId: string, handler: string): QueueEntry[] {
    const now = new Date();
    const reception = this.queueEntriesRepository.create({
      visitId,
      department: Department.RECEPTION,
      status: QueueEntryStatus.COMPLETED,
      priority: 5,
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
        priority: 5,
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
