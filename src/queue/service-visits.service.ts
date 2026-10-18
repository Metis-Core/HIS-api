import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager, In } from 'typeorm';
import { AfterCommit, commitThenEmit } from 'common/events/after-commit';
import { Department } from 'common/enums/department.enum';
import { Patient } from 'src/patients/entities/patient.entity';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { ServiceVisitKind } from './enums/service-visit.enum';
import { VisitIntenentsEnum, VisitTypeEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
import { priorityFor } from './journey/visit-priority';
import { LabOnlyVisitsService } from './lab-only-visits.service';
import { QueueEntriesService } from './queue-entries.service';

export const SERVICE_VISIT_INTENT: Record<
  ServiceVisitKind,
  VisitIntenentsEnum
> = {
  [ServiceVisitKind.ANTENATAL]: VisitIntenentsEnum.ANTENATAL,
  [ServiceVisitKind.IMMUNIZATION]: VisitIntenentsEnum.IMMUNIZATION,
};

const OPEN_STATUSES = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];

/** A patient who comes only for antenatal care or immunization skips triage and the consultation fee. */
@Injectable()
export class ServiceVisitsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
    private readonly labOnlyVisits: LabOnlyVisitsService,
    private readonly queueEntries: QueueEntriesService,
  ) {}

  /** Adds the service to the patient's active visit, or opens a visit that has only that service. */
  async checkIn(
    patientId: string,
    service: ServiceVisitKind,
    handlerId: string,
  ): Promise<Visit> {
    const intent = SERVICE_VISIT_INTENT[service];
    const manager = this.dataSource.manager;
    if (!(await manager.existsBy(Patient, { id: patientId }))) {
      throw new NotFoundException('Patient not found');
    }
    const active = await this.labOnlyVisits.findActive(manager, patientId);
    if (!active) {
      return commitThenEmit(this.dataSource, this.events, (tx, after) =>
        this.open(tx, patientId, service, handlerId, after),
      );
    }
    const alreadyQueued = await manager.existsBy(QueueEntry, {
      visitId: active.id,
      department: Department.ANTENATAL,
      status: In(OPEN_STATUSES),
    });
    if (alreadyQueued) return active;
    await this.queueEntries.ensureIntent(active.id, intent);
    this.events.emit(
      VisitCheckedInEvent.channel,
      new VisitCheckedInEvent(active.id, patientId, handlerId, [intent]),
    );
    return active;
  }

  private async open(
    manager: EntityManager,
    patientId: string,
    service: ServiceVisitKind,
    handlerId: string,
    after: AfterCommit,
  ): Promise<Visit> {
    const intents = [SERVICE_VISIT_INTENT[service]];
    const priority = priorityFor(null);
    const visit = await manager.save(
      manager.create(Visit, {
        patientId,
        checkedInById: handlerId,
        visitType: VisitTypeEnum.WALK_IN,
        triageCategory: null,
        priority,
        metadata: { initialIntents: intents, serviceVisit: service },
      }),
    );
    const now = new Date();
    await manager.save([
      manager.create(QueueEntry, {
        visitId: visit.id,
        department: Department.RECEPTION,
        status: QueueEntryStatus.COMPLETED,
        priority,
        sequenceNumber: 1,
        servedById: handlerId,
        calledAt: now,
        startedAt: now,
        completedAt: now,
      }),
      manager.create(QueueEntry, {
        visitId: visit.id,
        department: Department.ANTENATAL,
        status: QueueEntryStatus.WAITING,
        priority,
        sequenceNumber: 2,
      }),
    ]);
    after.emit(
      VisitCheckedInEvent.channel,
      new VisitCheckedInEvent(visit.id, patientId, handlerId, intents),
    );
    return visit;
  }
}
