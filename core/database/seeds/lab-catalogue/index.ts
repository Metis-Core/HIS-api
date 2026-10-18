import { CHEMISTRY } from './chemistry';
import type { SeedLabTest } from './fields';
import { HAEMATOLOGY } from './haematology';
import { MICROBIOLOGY } from './microbiology';
import { PARASITOLOGY } from './parasitology';
import { SEROLOGY } from './serology';
import { URINE_AND_STOOL } from './urine-stool';

export type { SeedLabTest } from './fields';

/** Standard Suubi lab menu (L4) with the urinalysis, CBC, blood slide and stool templates (L5). */
export const LAB_CATALOGUE: SeedLabTest[] = [
  ...HAEMATOLOGY,
  ...URINE_AND_STOOL,
  ...PARASITOLOGY,
  ...CHEMISTRY,
  ...SEROLOGY,
  ...MICROBIOLOGY,
];
