import type { LabResultSchema } from 'src/lab/results/result-schema.types';
import { ClinicRecordKind } from '../enums/clinic-record-kind.enum';
import { ANTENATAL_VISIT } from './antenatal-visit';
import { DELIVERY } from './delivery';
import { IMMUNIZATION } from './immunization';
import { POSTNATAL_VISIT } from './postnatal-visit';

export const CLINIC_TEMPLATES: Record<ClinicRecordKind, LabResultSchema> = {
  [ClinicRecordKind.ANTENATAL_VISIT]: ANTENATAL_VISIT,
  [ClinicRecordKind.DELIVERY]: DELIVERY,
  [ClinicRecordKind.POSTNATAL_VISIT]: POSTNATAL_VISIT,
  [ClinicRecordKind.IMMUNIZATION]: IMMUNIZATION,
};
