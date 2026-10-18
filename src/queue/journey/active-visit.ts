import { EntityManager } from 'typeorm';
import { Visit } from '../entities/visit.entity';
import { QueueEntryStatus } from '../enums/queue-entry-status.enum';
import { VisitStatusEnum } from '../enums/visit-status.enum';

export const ACTIVE_VISIT_STATUSES = [
  VisitStatusEnum.OPEN,
  VisitStatusEnum.IN_PROGRESS,
];
const OPEN_QUEUE_STATUSES = [
  QueueEntryStatus.WAITING,
  QueueEntryStatus.CALLED,
  QueueEntryStatus.IN_SERVICE,
];

// Visit status is never advanced, so a visit is active while it is in someone's queue or the patient is admitted and not yet discharged.
export function findActiveVisit(
  manager: EntityManager,
  patientId: string,
): Promise<Visit | null> {
  return manager
    .createQueryBuilder(Visit, 'visit')
    .where('visit.patientId = :patientId', { patientId })
    .andWhere('visit.status IN (:...statuses)', {
      statuses: ACTIVE_VISIT_STATUSES,
    })
    .andWhere(
      `(EXISTS (SELECT 1 FROM "queue_entries" qe WHERE qe."visitId" = visit.id AND qe."deletedAt" IS NULL AND qe."status" IN (:...open))
        OR EXISTS (SELECT 1 FROM "admissions" a WHERE a."visitId" = visit.id AND a."deletedAt" IS NULL AND a."dischargedAt" IS NULL))`,
      { open: OPEN_QUEUE_STATUSES },
    )
    .orderBy('visit.createdAt', 'DESC')
    .addOrderBy('visit.id', 'DESC')
    .getOne();
}
