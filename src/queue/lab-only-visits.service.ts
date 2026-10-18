import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { AfterCommit, commitThenEmit } from 'common/events/after-commit';
import { Department } from 'common/enums/department.enum';
import { Patient } from 'src/patients/entities/patient.entity';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from './entities/visit.entity';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';
import { VisitIntenentsEnum, VisitTypeEnum } from './enums/visit-type.enum';
import { VisitCheckedInEvent } from './events/visit-checked-in.event';
import { ACTIVE_VISIT_STATUSES, findActiveVisit } from './journey/active-visit';
import { priorityFor } from './journey/visit-priority';

export const LAB_ONLY_INTENTS = [VisitIntenentsEnum.LAB];
export { ACTIVE_VISIT_STATUSES };

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

  findActive(manager: EntityManager, patientId: string): Promise<Visit | null> {
    return findActiveVisit(manager, patientId);
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
