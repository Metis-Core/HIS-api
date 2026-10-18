import { ageInYears } from 'common/utils/age';
import type { Patient } from 'src/patients/entities/patient.entity';
import type { LabPatientContext } from './interpret-result';

/** Sex and age at the moment the result applies to, for picking reference intervals. */
export function patientContext(
  patient: Pick<Patient, 'gender' | 'dateOfBirth'> | null | undefined,
  at: Date,
): LabPatientContext {
  return {
    gender: patient?.gender ?? null,
    ageYears: ageInYears(patient?.dateOfBirth, at),
  };
}
