import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import { female, male, num, SeedLabTest, text, underFive } from './fields';

const H = LabTestCategory.HEMATOLOGY;
const B = LabSampleType.BLOOD;
const g = (group: string) => ({ group });

// Typical 3-part-differential analyser intervals; the lab lead must confirm them against Suubi's analyser.
export const CBC: SeedLabTest = {
  code: 'CBC',
  abbreviation: 'FBC',
  name: 'Complete blood count (full haemogram)',
  category: H,
  sampleType: B,
  price: 20000,
  turnaroundHours: 2,
  fields: [
    num(
      'wbc',
      'White blood cells (WBC)',
      '×10⁹/L',
      [
        { low: 4, high: 11, criticalLow: 2, criticalHigh: 30 },
        underFive(5.5, 15.5, { criticalLow: 2, criticalHigh: 30 }),
      ],
      { required: true, ...g('White cells') },
    ),
    num(
      'lym_abs',
      'Lymphocytes #',
      '×10⁹/L',
      [{ low: 1, high: 4 }],
      g('White cells'),
    ),
    num(
      'mid_abs',
      'Mid cells #',
      '×10⁹/L',
      [{ low: 0.1, high: 1 }],
      g('White cells'),
    ),
    num(
      'gra_abs',
      'Granulocytes #',
      '×10⁹/L',
      [{ low: 2, high: 7.5 }],
      g('White cells'),
    ),
    num(
      'lym_pct',
      'Lymphocytes %',
      '%',
      [{ low: 20, high: 40 }],
      g('White cells'),
    ),
    num(
      'mid_pct',
      'Mid cells %',
      '%',
      [{ low: 3, high: 10 }],
      g('White cells'),
    ),
    num(
      'gra_pct',
      'Granulocytes %',
      '%',
      [{ low: 50, high: 70 }],
      g('White cells'),
    ),
    num(
      'rbc',
      'Red blood cells (RBC)',
      '×10¹²/L',
      [{ low: 3.8, high: 5.9 }, male(4.5, 5.9), female(3.8, 5.2)],
      g('Red cells'),
    ),
    num(
      'hgb',
      'Haemoglobin (HGB)',
      'g/dL',
      [
        { low: 11, high: 16, criticalLow: 7, criticalHigh: 20 },
        male(13, 17, { criticalLow: 7, criticalHigh: 20 }),
        female(12, 15.5, { criticalLow: 7, criticalHigh: 20 }),
        underFive(11, 14, { criticalLow: 7 }),
      ],
      { required: true, ...g('Red cells') },
    ),
    num(
      'hct',
      'Haematocrit (HCT)',
      '%',
      [{ low: 34, high: 52 }, male(40, 52), female(36, 46)],
      g('Red cells'),
    ),
    num(
      'mcv',
      'Mean cell volume (MCV)',
      'fL',
      [{ low: 80, high: 100 }],
      g('Red cells'),
    ),
    num(
      'mch',
      'Mean cell haemoglobin (MCH)',
      'pg',
      [{ low: 27, high: 33 }],
      g('Red cells'),
    ),
    num(
      'mchc',
      'MCH concentration (MCHC)',
      'g/dL',
      [{ low: 32, high: 36 }],
      g('Red cells'),
    ),
    num(
      'rdw',
      'Red cell distribution width (RDW-CV)',
      '%',
      [{ low: 11.5, high: 14.5 }],
      g('Red cells'),
    ),
    num(
      'plt',
      'Platelets (PLT)',
      '×10⁹/L',
      [{ low: 150, high: 450, criticalLow: 50, criticalHigh: 1000 }],
      { required: true, ...g('Platelets') },
    ),
    num(
      'mpv',
      'Mean platelet volume (MPV)',
      'fL',
      [{ low: 7.5, high: 11.5 }],
      g('Platelets'),
    ),
    text('comment', 'Comment'),
  ],
};
