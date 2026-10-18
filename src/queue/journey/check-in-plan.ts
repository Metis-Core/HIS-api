import { BadRequestException } from '@nestjs/common';
import { ServiceVisitKind } from '../enums/service-visit.enum';
import { VisitIntenentsEnum, VisitTypeEnum } from '../enums/visit-type.enum';

export const SERVICE_VISIT_INTENT: Record<
  ServiceVisitKind,
  VisitIntenentsEnum
> = {
  [ServiceVisitKind.ANTENATAL]: VisitIntenentsEnum.ANTENATAL,
  [ServiceVisitKind.DELIVERY]: VisitIntenentsEnum.DELIVERY,
  [ServiceVisitKind.POSTNATAL]: VisitIntenentsEnum.POSTNATAL,
  [ServiceVisitKind.IMMUNIZATION]: VisitIntenentsEnum.IMMUNIZATION,
};

/** Stages reception may book at check-in besides the consultation and the maternity services. */
export const BOOKABLE_STAGES: readonly VisitIntenentsEnum[] = [
  VisitIntenentsEnum.LAB,
  VisitIntenentsEnum.RADIOLOGY,
  VisitIntenentsEnum.SURGERY,
];

export interface CheckInChoices {
  visitType?: VisitTypeEnum;
  /** Triage is on unless explicitly switched off. */
  triage?: boolean;
  /** A consultation is on unless explicitly switched off. */
  consultation?: boolean;
  service?: ServiceVisitKind;
  stages?: readonly VisitIntenentsEnum[];
}

/** The stages of a new visit, in order. Triage is on by default and always on for emergencies. */
export function planCheckIn(choices: CheckInChoices): VisitIntenentsEnum[] {
  const emergency = choices.visitType === VisitTypeEnum.EMERGENCY;
  const triage = emergency || choices.triage !== false;
  const consultation = emergency || choices.consultation !== false;
  const service = choices.service
    ? [SERVICE_VISIT_INTENT[choices.service]]
    : [];
  const stages = [...new Set(choices.stages ?? [])];
  if (stages.some((stage) => !BOOKABLE_STAGES.includes(stage))) {
    throw new BadRequestException('That stage cannot be booked at check-in');
  }
  const reason = [
    ...(consultation ? [VisitIntenentsEnum.CONSULTATION] : []),
    ...service,
    ...stages,
  ];
  if (reason.length === 0) {
    throw new BadRequestException('Choose what the patient came for');
  }
  return [...(triage ? [VisitIntenentsEnum.EXAMINATION] : []), ...reason];
}

/** Visits that predate the choice, and any without a record of it, still expect a consultation after triage. */
export function wantsConsultation(metadata: unknown): boolean {
  const intents = (metadata as { initialIntents?: unknown } | null)
    ?.initialIntents;
  return (
    !Array.isArray(intents) || intents.includes(VisitIntenentsEnum.CONSULTATION)
  );
}
