import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import { female, male, num, SeedLabTest } from './fields';

const C = LabTestCategory.CHEMISTRY;
const B = LabSampleType.BLOOD;
const req = { required: true };

export const CHEMISTRY: SeedLabTest[] = [
  {
    code: 'RBS',
    name: 'Random blood sugar',
    category: C,
    sampleType: B,
    price: 5000,
    turnaroundHours: 1,
    fields: [
      num(
        'glucose',
        'Glucose (random)',
        'mmol/L',
        [{ low: 3.9, high: 7.8, criticalLow: 2.8, criticalHigh: 22.2 }],
        req,
      ),
    ],
  },
  {
    code: 'FBS',
    name: 'Fasting blood sugar',
    category: C,
    sampleType: B,
    price: 5000,
    turnaroundHours: 1,
    fields: [
      num(
        'glucose',
        'Glucose (fasting)',
        'mmol/L',
        [{ low: 3.9, high: 5.5, criticalLow: 2.8, criticalHigh: 22.2 }],
        req,
      ),
    ],
  },
  {
    code: 'HBA1C',
    name: 'Glycated haemoglobin',
    category: C,
    sampleType: B,
    price: 40000,
    turnaroundHours: 4,
    fields: [num('hba1c', 'HbA1c', '%', [{ low: 4, high: 5.6 }], req)],
  },
  {
    code: 'RFT',
    abbreviation: 'U&E',
    name: 'Renal function tests (urea, creatinine and electrolytes)',
    category: C,
    sampleType: B,
    price: 45000,
    turnaroundHours: 4,
    fields: [
      num('urea', 'Urea', 'mmol/L', [{ low: 2.5, high: 7.8 }]),
      num(
        'creatinine',
        'Creatinine',
        'µmol/L',
        [{ low: 53, high: 115 }, male(62, 115), female(53, 97)],
        req,
      ),
      num('sodium', 'Sodium', 'mmol/L', [
        { low: 135, high: 145, criticalLow: 120, criticalHigh: 160 },
      ]),
      num('potassium', 'Potassium', 'mmol/L', [
        { low: 3.5, high: 5.1, criticalLow: 2.5, criticalHigh: 6.5 },
      ]),
      num('chloride', 'Chloride', 'mmol/L', [{ low: 98, high: 107 }]),
    ],
  },
  {
    code: 'LFT',
    name: 'Liver function tests',
    category: C,
    sampleType: B,
    price: 50000,
    turnaroundHours: 4,
    fields: [
      num('alt', 'ALT', 'U/L', [{ low: 0, high: 45 }]),
      num('ast', 'AST', 'U/L', [{ low: 0, high: 40 }]),
      num('alp', 'Alkaline phosphatase', 'U/L', [{ low: 40, high: 130 }]),
      num('ggt', 'Gamma-GT', 'U/L', [{ low: 0, high: 55 }]),
      num('tbil', 'Total bilirubin', 'µmol/L', [{ low: 0, high: 21 }]),
      num('dbil', 'Direct bilirubin', 'µmol/L', [{ low: 0, high: 5 }]),
      num('tprot', 'Total protein', 'g/L', [{ low: 60, high: 80 }]),
      num('alb', 'Albumin', 'g/L', [{ low: 35, high: 50 }]),
    ],
  },
  {
    code: 'LIPID',
    name: 'Lipid profile',
    category: C,
    sampleType: B,
    price: 45000,
    turnaroundHours: 4,
    fields: [
      num('tc', 'Total cholesterol', 'mmol/L', [{ high: 5.2 }]),
      num('tg', 'Triglycerides', 'mmol/L', [{ high: 1.7 }]),
      num('hdl', 'HDL cholesterol', 'mmol/L', [{ low: 1 }]),
      num('ldl', 'LDL cholesterol', 'mmol/L', [{ high: 3.4 }]),
    ],
  },
  {
    code: 'URIC',
    name: 'Serum uric acid',
    category: C,
    sampleType: B,
    price: 15000,
    turnaroundHours: 4,
    fields: [
      num(
        'uric',
        'Uric acid',
        'µmol/L',
        [{ low: 150, high: 420 }, male(200, 420), female(150, 360)],
        req,
      ),
    ],
  },
  {
    code: 'CRP',
    name: 'C-reactive protein (quantitative)',
    category: C,
    sampleType: B,
    price: 20000,
    turnaroundHours: 2,
    fields: [num('crp', 'CRP', 'mg/L', [{ high: 5 }], req)],
  },
];
