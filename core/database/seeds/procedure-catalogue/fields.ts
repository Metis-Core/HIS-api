import type { LabResultField } from 'src/lab/results/result-schema.types';
import type { OrderKind } from 'src/orders/enums/order-kind.enum';
import type { ProcedureCategory } from 'src/orders/enums/procedure-category.enum';
import { pick, text } from '../lab-catalogue/fields';

export { num, pick, text } from '../lab-catalogue/fields';

export interface SeedProcedureTest {
  code: string;
  abbreviation?: string;
  name: string;
  description?: string;
  kind: OrderKind;
  category: ProcedureCategory;
  price: number;
  durationMinutes?: number;
  preparation?: string;
  fields: LabResultField[];
}

/** A finding whose first option is the normal one; anything else is flagged as outside the normal pattern. */
export const finding = (
  key: string,
  label: string,
  options: string[],
  extra: Partial<LabResultField> = {},
): LabResultField => pick(key, label, options, [options[0]], extra);

export const comments = (): LabResultField =>
  text('comments', 'Other findings', {
    helpText: 'Anything not covered above',
  });

export const COMPLICATIONS = ['None', 'Bleeding', 'Infection', 'Other'];
export const ANAESTHESIA = ['None', 'Local', 'Regional', 'General'];
