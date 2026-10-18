import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import {
  AMOUNT,
  DIPSTICK,
  NEG_POS,
  num,
  pick,
  SEEN,
  SeedLabTest,
  text,
} from './fields';

const physical = { group: 'Physical' };
const dip = { group: 'Dipstick' };
const micro = { group: 'Microscopy' };

export const URINALYSIS: SeedLabTest = {
  code: 'URINALYSIS',
  abbreviation: 'U/A',
  name: 'Urinalysis (urine routine examination)',
  category: LabTestCategory.URINALYSIS,
  sampleType: LabSampleType.URINE,
  price: 8000,
  turnaroundHours: 1,
  fields: [
    pick(
      'colour',
      'Colour',
      [
        'Pale yellow',
        'Yellow',
        'Dark yellow',
        'Amber',
        'Red',
        'Brown',
        'Other',
      ],
      ['Pale yellow', 'Yellow'],
      physical,
    ),
    pick(
      'appearance',
      'Appearance',
      ['Clear', 'Slightly cloudy', 'Cloudy', 'Turbid'],
      ['Clear'],
      physical,
    ),
    num('ph', 'pH', '', [{ low: 4.5, high: 8 }], dip),
    num('sg', 'Specific gravity', '', [{ low: 1.005, high: 1.03 }], dip),
    pick('protein', 'Protein', DIPSTICK, ['Negative'], dip),
    pick('glucose', 'Glucose', DIPSTICK, ['Negative'], dip),
    pick('ketones', 'Ketones', DIPSTICK, ['Negative'], dip),
    pick('blood', 'Blood', DIPSTICK, ['Negative'], dip),
    pick('bilirubin', 'Bilirubin', DIPSTICK, ['Negative'], dip),
    pick(
      'urobilinogen',
      'Urobilinogen',
      ['Normal', '+', '++', '+++'],
      ['Normal'],
      dip,
    ),
    pick('nitrite', 'Nitrite', NEG_POS, ['Negative'], dip),
    pick('leukocytes', 'Leukocyte esterase', DIPSTICK, ['Negative'], dip),
    text('pus_cells', 'Pus cells (/HPF)', { helpText: 'e.g. 0-5', ...micro }),
    text('rbcs', 'Red cells (/HPF)', { helpText: 'e.g. 0-2', ...micro }),
    pick('epithelial', 'Epithelial cells', AMOUNT, [], micro),
    pick('bacteria', 'Bacteria', AMOUNT, ['None'], micro),
    pick('yeast', 'Yeast cells', AMOUNT, ['None'], micro),
    pick('t_vaginalis', 'Trichomonas vaginalis', SEEN, ['Not seen'], micro),
    pick('s_haematobium', 'S. haematobium ova', SEEN, ['Not seen'], micro),
    text('casts', 'Casts', micro),
    text('crystals', 'Crystals', micro),
    text('comment', 'Comment'),
  ],
};
