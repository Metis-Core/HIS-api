import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import { pick, SeedLabTest, text } from './fields';

const M = LabTestCategory.MICROBIOLOGY;

export const MICROBIOLOGY: SeedLabTest[] = [
  {
    code: 'AFB',
    abbreviation: 'ZN',
    name: 'Sputum for acid-fast bacilli (Ziehl-Neelsen)',
    category: M,
    sampleType: LabSampleType.SPUTUM,
    price: 0,
    turnaroundHours: 24,
    fields: [
      pick(
        'result',
        'AFB',
        ['No AFB seen', 'Scanty', '1+', '2+', '3+'],
        ['No AFB seen'],
        { required: true },
      ),
      text('comment', 'Comment'),
    ],
  },
  {
    code: 'GRAM',
    name: 'Gram stain',
    category: M,
    sampleType: LabSampleType.SWAB,
    price: 10000,
    turnaroundHours: 2,
    fields: [
      text('specimen', 'Specimen'),
      text('findings', 'Findings', { required: true }),
    ],
  },
  {
    code: 'HVS',
    name: 'High vaginal swab (wet preparation)',
    category: M,
    sampleType: LabSampleType.SWAB,
    price: 10000,
    turnaroundHours: 2,
    fields: [
      pick(
        'pus_cells',
        'Pus cells',
        ['None', 'Few', 'Moderate', 'Many'],
        ['None'],
      ),
      pick('t_vaginalis', 'T. vaginalis', ['Not seen', 'Seen'], ['Not seen']),
      pick('yeast', 'Yeast cells', ['Not seen', 'Seen'], ['Not seen']),
      pick('clue_cells', 'Clue cells', ['Not seen', 'Seen'], ['Not seen']),
      text('comment', 'Comment'),
    ],
  },
  {
    code: 'URINE-CS',
    abbreviation: 'C&S',
    name: 'Urine culture and sensitivity',
    category: M,
    sampleType: LabSampleType.URINE,
    price: 35000,
    turnaroundHours: 72,
    fields: [
      pick(
        'growth',
        'Growth',
        ['No growth', 'Insignificant growth', 'Significant growth'],
        ['No growth'],
        { required: true },
      ),
      text('organism', 'Organism isolated'),
      text('sensitive', 'Sensitive to'),
      text('resistant', 'Resistant to'),
    ],
  },
];
