import { SelectQueryBuilder } from 'typeorm';
import { Consultation } from './entities/consultation.entity';
import { QueryConsultationsDto } from './dto/query-consultations.dto';

type Filterable = Pick<
  QueryConsultationsDto,
  | 'patientId'
  | 'doctorId'
  | 'visitId'
  | 'triageId'
  | 'status'
  | 'type'
  | 'department'
>;

const EQUALS: ReadonlyArray<keyof Filterable> = [
  'patientId',
  'doctorId',
  'visitId',
  'triageId',
  'status',
  'type',
  'department',
];

const RANGES: ReadonlyArray<{
  key: keyof QueryConsultationsDto;
  column: 'startedAt' | 'createdAt';
  op: '>=' | '<=';
}> = [
  { key: 'startedFrom', column: 'startedAt', op: '>=' },
  { key: 'startedTo', column: 'startedAt', op: '<=' },
  { key: 'createdFrom', column: 'createdAt', op: '>=' },
  { key: 'createdTo', column: 'createdAt', op: '<=' },
];

const TEXT_MATCH = `(
  LOWER(consultation.chiefComplaint) LIKE :term OR
  LOWER(COALESCE(consultation.diagnosis, '')) LIKE :term OR
  LOWER(COALESCE(consultation.icd10Codes, '')) LIKE :term OR
  LOWER(patient.mrn) LIKE :term OR
  LOWER(patient.firstName) LIKE :term OR
  LOWER(patient.lastName) LIKE :term
)`;

/** Applies the list filters to a query on alias `consultation` joined to `patient`. */
export function applyConsultationFilters(
  qb: SelectQueryBuilder<Consultation>,
  query: QueryConsultationsDto,
): SelectQueryBuilder<Consultation> {
  EQUALS.filter((key) => query[key]).forEach((key) =>
    qb.andWhere(`consultation.${key} = :${key}`, { [key]: query[key] }),
  );
  RANGES.filter(({ key }) => query[key]).forEach(({ key, column, op }) =>
    qb.andWhere(`consultation.${column} ${op} :${key}`, { [key]: query[key] }),
  );
  const term = query.q?.trim().toLowerCase();
  if (term) qb.andWhere(TEXT_MATCH, { term: `%${term}%` });
  return qb;
}
