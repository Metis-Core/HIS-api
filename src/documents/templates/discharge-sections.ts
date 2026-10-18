import { Consultation } from 'src/consultation/entities/consultation.entity';
import { escape } from './shared';

const section = (label: string, html: string): string =>
  html
    ? `<mj-text class="label">${label}</mj-text><mj-text>${html}</mj-text>`
    : '';

const text = (value: string | null | undefined): string =>
  value ? escape(value) : '';

/** Coded diagnoses, primary first, one per line, e.g. "B54 Unspecified malaria (primary)". */
export function codedDiagnoses(consultation: Consultation): string {
  return [...(consultation.diagnoses ?? [])]
    .sort(
      (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.rank - b.rank,
    )
    .map(
      (d) =>
        escape(`${d.code} ${d.title ?? ''}`.trim()) +
        (d.isPrimary ? ' (primary)' : ''),
    )
    .join('<br />');
}

/** The clinical narrative of the discharge summary, skipping empty fields. */
export function clinicalSections(consultation: Consultation): string {
  return [
    section('Chief complaint', text(consultation.chiefComplaint)),
    section(
      'History of present illness',
      text(consultation.historyOfPresentIllness),
    ),
    section(
      'Examination and assessment',
      text(consultation.examinationAndAssessment),
    ),
    section('Diagnosis', text(consultation.diagnosis)),
    section('Coded diagnoses', codedDiagnoses(consultation)),
    section('Plan', text(consultation.plan)),
  ].join('\n');
}
