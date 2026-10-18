import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AfterCommit } from 'common/events/after-commit';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import {
  ACTIVE_VISIT_STATUSES,
  LabOnlyVisitsService,
} from 'src/queue/lab-only-visits.service';

export interface OrderLinks {
  patientId: string;
  consultationId?: string | null;
  visitId?: string | null;
}

export interface ResolvedLinks {
  consultationId: string | null;
  visitId: string;
}

/**
 * L9: every order hangs off a visit so it is billed and queued.
 * Explicit links must belong to the patient; with none, the patient's active visit is used,
 * or a lab-only visit is opened in the same transaction.
 */
export async function resolveOrderVisit(
  manager: EntityManager,
  links: OrderLinks,
  actorId: string,
  after: AfterCommit,
  labOnlyVisits: LabOnlyVisitsService,
): Promise<ResolvedLinks> {
  const consultation = links.consultationId
    ? await manager.findOneBy(Consultation, { id: links.consultationId })
    : null;
  if (links.consultationId && consultation?.patientId !== links.patientId) {
    throw new BadRequestException(
      'That consultation does not belong to this patient',
    );
  }
  const consultationId = consultation?.id ?? null;
  const visitId = links.visitId ?? consultation?.visitId ?? null;
  if (visitId) {
    const visit = await manager.findOneBy(Visit, { id: visitId });
    if (visit?.patientId !== links.patientId) {
      throw new BadRequestException(
        'That visit does not belong to this patient',
      );
    }
    if (consultation?.visitId && consultation.visitId !== visitId) {
      throw new BadRequestException(
        'The consultation belongs to a different visit',
      );
    }
    if (!ACTIVE_VISIT_STATUSES.includes(visit.status)) {
      throw new BadRequestException(
        "That visit is closed; order against the patient's current visit instead",
      );
    }
    return { consultationId, visitId };
  }
  const active = await labOnlyVisits.findActive(manager, links.patientId);
  const visit =
    active ??
    (await labOnlyVisits.open(manager, links.patientId, actorId, after));
  return { consultationId, visitId: visit.id };
}
