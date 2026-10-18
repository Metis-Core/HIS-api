import { CreateConsultationDto } from './dto/create-consultation.dto';
import { Consultation } from './entities/consultation.entity';

/** Free-text encounter fields: trimmed, and an empty value clears the field. */
export const ENCOUNTER_TEXT_FIELDS = [
  'historyOfPresentIllness',
  'examinationAndAssessment',
  'diagnosis',
  'plan',
  'notes',
] as const;

type EncounterTextField = (typeof ENCOUNTER_TEXT_FIELDS)[number];
type EncounterInput = Partial<Pick<CreateConsultationDto, EncounterTextField>>;
type HeaderInput = Partial<
  Pick<CreateConsultationDto, 'chiefComplaint' | 'followUpDate' | 'startedAt'>
>;

const cleanText = (value?: string | null): string | null =>
  value?.trim() || null;

/** The encounter fields present in the input, ready to assign onto a consultation. */
export function encounterChanges(
  input: EncounterInput,
): Partial<Pick<Consultation, EncounterTextField>> {
  const changes: Partial<Pick<Consultation, EncounterTextField>> = {};
  ENCOUNTER_TEXT_FIELDS.filter((field) => input[field] !== undefined).forEach(
    (field) => {
      changes[field] = cleanText(input[field]);
    },
  );
  return changes;
}

/** Chief complaint, follow-up and start time present in the input. */
export function headerChanges(
  input: HeaderInput,
): Partial<
  Pick<Consultation, 'chiefComplaint' | 'followUpDate' | 'startedAt'>
> {
  return {
    ...(input.chiefComplaint !== undefined && {
      chiefComplaint: input.chiefComplaint.trim(),
    }),
    ...(input.followUpDate !== undefined && {
      followUpDate: input.followUpDate || null,
    }),
    ...(input.startedAt !== undefined && {
      startedAt: new Date(input.startedAt),
    }),
  };
}
