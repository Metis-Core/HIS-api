import { PROCEDURE_CATALOGUE } from './procedures';
import { RADIOLOGY_CATALOGUE } from './radiology';
import type { SeedProcedureTest } from './fields';

export type { SeedProcedureTest } from './fields';

export const IMAGING_AND_PROCEDURE_CATALOGUE: SeedProcedureTest[] = [
  ...RADIOLOGY_CATALOGUE,
  ...PROCEDURE_CATALOGUE,
];
