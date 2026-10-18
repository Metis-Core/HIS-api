import { CBC } from './cbc';
import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import {
  female,
  male,
  num,
  pick,
  qualitative,
  SeedLabTest,
  text,
  underFive,
  NEG_POS,
} from './fields';

const H = LabTestCategory.HEMATOLOGY;
const B = LabSampleType.BLOOD;

export const HAEMATOLOGY: SeedLabTest[] = [
  CBC,
  {
    code: 'HB',
    abbreviation: 'HGB',
    name: 'Haemoglobin estimation',
    category: H,
    sampleType: B,
    price: 5000,
    turnaroundHours: 1,
    fields: [
      num(
        'hgb',
        'Haemoglobin',
        'g/dL',
        [
          { low: 11, high: 16, criticalLow: 7, criticalHigh: 20 },
          male(13, 17, { criticalLow: 7 }),
          female(12, 15.5, { criticalLow: 7 }),
          underFive(11, 14, { criticalLow: 7 }),
        ],
        { required: true },
      ),
    ],
  },
  {
    code: 'ESR',
    name: 'Erythrocyte sedimentation rate',
    category: H,
    sampleType: B,
    price: 5000,
    turnaroundHours: 2,
    fields: [
      num(
        'esr',
        'ESR (Westergren, 1 hour)',
        'mm/hr',
        [{ low: 0, high: 20 }, male(0, 15), female(0, 20)],
        { required: true },
      ),
    ],
  },
  {
    code: 'BGRH',
    abbreviation: 'GXM',
    name: 'Blood grouping and Rhesus factor',
    category: H,
    sampleType: B,
    price: 5000,
    turnaroundHours: 1,
    fields: [
      pick('group', 'ABO group', ['A', 'B', 'AB', 'O'], [], { required: true }),
      pick('rhesus', 'Rhesus (D)', ['Positive', 'Negative'], [], {
        required: true,
      }),
    ],
  },
  {
    code: 'SICKLE',
    abbreviation: 'SCT',
    name: 'Sickling test',
    category: H,
    sampleType: B,
    price: 8000,
    turnaroundHours: 2,
    fields: qualitative('Sickling', NEG_POS),
  },
  {
    code: 'PBF',
    name: 'Peripheral blood film',
    category: H,
    sampleType: B,
    price: 15000,
    turnaroundHours: 24,
    fields: [
      text('rbc_morphology', 'Red cell morphology'),
      text('wbc_morphology', 'White cell morphology'),
      text('platelets', 'Platelets'),
      text('impression', 'Impression', { required: true }),
    ],
  },
];
