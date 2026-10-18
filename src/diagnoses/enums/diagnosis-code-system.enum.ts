// Decision 2 (ICD-10 vs ICD-11) is open, so every code carries the system it came from.
export enum DiagnosisCodeSystem {
  ICD10_CM = 'ICD-10-CM',
  ICD10 = 'ICD-10',
  ICD11 = 'ICD-11',
}
