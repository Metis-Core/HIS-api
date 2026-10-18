import { Brackets, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { containsPattern } from './like-pattern';

/** class-transformer helper: "a,b" (or repeated ?x=a&x=b) becomes ['a', 'b']. */
export const toList = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : value;

/** Narrows a list by patient name or MRN; every word must match one of them. */
export function wherePatientMatches<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  patientAlias: string,
  search?: string,
): void {
  const words = search?.trim().split(/\s+/).filter(Boolean) ?? [];
  words.forEach((word, index) => {
    const param = `patientTerm${index}`;
    qb.andWhere(
      new Brackets((sub) => {
        ['firstName', 'lastName', 'mrn'].forEach((field) =>
          sub.orWhere(`${patientAlias}.${field} ILIKE :${param}`, {
            [param]: containsPattern(word),
          }),
        );
      }),
    );
  });
}
