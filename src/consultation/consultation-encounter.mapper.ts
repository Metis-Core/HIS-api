import { CreateConsultationDto } from './dto/create-consultation.dto';
import { Consultation } from './entities/consultation.entity';

/** Free-text encounter fields: trimmed, and an empty value clears the field. */
export const ENCOUNTER_TEXT_FIELDS = [
  'historyOfPresentIllness',
  'examinationFindings',
  'assessment',
  'diagnosis',
  'plan',
  'notes',
] as const;

type EncounterTextField = (typeof ENCOUNTER_TEXT_FIELDS)[number];
type EncounterInput = Partial<
  Pick<CreateConsultationDto, EncounterTextField | 'icd10Codes'>
>;
type HeaderInput = Partial<
  Pick<CreateConsultationDto, 'chiefComplaint' | 'followUpDate' | 'startedAt'>
>;

const cleanText = (value?: string | null): string | null =>
  value?.trim() || null;

export function normalizeIcdCodes(input?: string | null): string | null {
  if (input === undefined || input === null) return null;
  const cleaned = input
    .split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  return cleaned.length ? cleaned.join(',') : null;
}

/** The encounter fields present in the input, ready to assign onto a consultation. */
export function encounterChanges(
  input: EncounterInput,
): Partial<Pick<Consultation, EncounterTextField | 'icd10Codes'>> {
  const changes: Partial<
    Pick<Consultation, EncounterTextField | 'icd10Codes'>
  > = {};
  ENCOUNTER_TEXT_FIELDS.filter((field) => input[field] !== undefined).forEach(
    (field) => {
      changes[field] = cleanText(input[field]);
    },
  );
  if (input.icd10Codes !== undefined) {
    changes.icd10Codes = normalizeIcdCodes(input.icd10Codes);
  }
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
