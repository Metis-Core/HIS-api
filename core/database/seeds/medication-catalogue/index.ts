import { ANTI_INFECTIVES } from './anti-infectives';
import { CHRONIC_AND_OTHER } from './chronic-and-other';
import { GENERAL } from './general';

export type { SeedMedication } from './fields';

export const MEDICATION_CATALOGUE = [
  ...ANTI_INFECTIVES,
  ...GENERAL,
  ...CHRONIC_AND_OTHER,
];
