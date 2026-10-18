import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { AfterCommit, commitThenEmit } from 'common/events/after-commit';
import { Department } from 'common/enums/department.enum';
import { Patient } from 'src/patients/entities/patient.entity';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { VisitStatusEnum } from './enums/visit-status.enum';
import { VisitIntenentsEnum, VisitTypeEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
import { priorityFor } from './journey/visit-priority';

export const LAB_ONLY_INTENTS = [VisitIntenentsEnum.LAB];
const OPEN_QUEUE_STATUSES = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];
export const ACTIVE_VISIT_STATUSES = [
  VisitStatusEnum.OPEN,
  VisitStatusEnum.IN_PROGRESS,
];

/** L1/L9: a walk-in who only needs tests gets a visit with a lab stage and no consultation (so no consultation fee). */
@Injectable()
export class LabOnlyVisitsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
  ) {}

  /** Reuses the patient's active visit; otherwise opens a lab-only one. */
  checkIn(patientId: string, handlerId: string): Promise<Visit> {
    return commitThenEmit(
      this.dataSource,
      this.events,
      async (manager, after) => {
        const patient = await manager.findOneBy(Patient, { id: patientId });
        if (!patient) throw new NotFoundException('Patient not found');
        const active = await this.findActive(manager, patientId);
        if (active) return active;
        return this.open(manager, patientId, handlerId, after);
      },
    );
  }

  // Visit status is not advanced anywhere yet, so "active" means a visit still in someone's queue.
  findActive(manager: EntityManager, patientId: string): Promise<Visit | null> {
    return manager
      .createQueryBuilder(Visit, 'visit')
      .where('visit.patientId = :patientId', { patientId })
      .andWhere('visit.status IN (:...statuses)', {
        statuses: ACTIVE_VISIT_STATUSES,
      })
      .andWhere(
        'EXISTS (SELECT 1 FROM "queue_entries" qe WHERE qe."visitId" = visit.id AND qe."deletedAt" IS NULL AND qe."status" IN (:...open))',
        { open: OPEN_QUEUE_STATUSES },
      )
      .orderBy('visit.createdAt', 'DESC')
      .addOrderBy('visit.id', 'DESC')
      .getOne();
  }

  // Runs inside the caller's transaction; the check-in event waits for the commit.
  async open(
    manager: EntityManager,
    patientId: string,
    handlerId: string,
    after: AfterCommit,
  ): Promise<Visit> {
    const priority = priorityFor(null);
    const visit = await manager.save(
      manager.create(Visit, {
        patientId,
        checkedInById: handlerId,
        visitType: VisitTypeEnum.WALK_IN,
        triageCategory: null,
        priority,
        metadata: { initialIntents: LAB_ONLY_INTENTS, labOnly: true },
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
        department: Department.MAIN_LABORATORY,
        status: QueueEntryStatus.WAITING,
        priority,
        sequenceNumber: 2,
      }),
    ]);
    after.emit(
      VisitCheckedInEvent.channel,
      new VisitCheckedInEvent(visit.id, patientId, handlerId, LAB_ONLY_INTENTS),
    );
    return visit;
  }
}
