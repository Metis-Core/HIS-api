import { URINALYSIS } from './urinalysis';
import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import {
  AMOUNT,
  NEG_POS,
  pick,
  qualitative,
  SeedLabTest,
  text,
} from './fields';

const micro = { group: 'Microscopy' };
const macro = { group: 'Macroscopy' };

export const URINE_AND_STOOL: SeedLabTest[] = [
  URINALYSIS,
  {
    code: 'STOOL',
    abbreviation: 'S/A',
    name: 'Stool analysis (macroscopy and microscopy)',
    category: LabTestCategory.PARASITOLOGY,
    sampleType: LabSampleType.STOOL,
    price: 8000,
    turnaroundHours: 1,
    fields: [
      pick(
        'consistency',
        'Consistency',
        ['Formed', 'Semi-formed', 'Loose', 'Watery'],
        ['Formed', 'Semi-formed'],
        macro,
      ),
      pick(
        'colour',
        'Colour',
        ['Brown', 'Yellow', 'Green', 'Black', 'Clay', 'Red'],
        ['Brown', 'Yellow'],
        macro,
      ),
      pick('mucus', 'Mucus', ['Absent', 'Present'], ['Absent'], macro),
      pick(
        'visible_blood',
        'Visible blood',
        ['Absent', 'Present'],
        ['Absent'],
        macro,
      ),
      text('parasites', 'Ova, cysts and parasites', {
        required: true,
        helpText: 'e.g. No ova or cysts seen; E. histolytica cysts seen',
        ...micro,
      }),
      pick('pus_cells', 'Pus cells', AMOUNT, ['None'], micro),
      pick('rbcs', 'Red cells', AMOUNT, ['None'], micro),
      pick('yeast', 'Yeast cells', AMOUNT, ['None'], micro),
      text('comment', 'Comment'),
    ],
  },
  {
    code: 'FOB',
    name: 'Faecal occult blood',
    category: LabTestCategory.CHEMISTRY,
    sampleType: LabSampleType.STOOL,
    price: 10000,
    turnaroundHours: 1,
    fields: qualitative('Occult blood', NEG_POS),
  },
  {
    code: 'HPYLORI-AG',
    abbreviation: 'H.PYLORI',
    name: 'Helicobacter pylori stool antigen',
    category: LabTestCategory.IMMUNOLOGY,
    sampleType: LabSampleType.STOOL,
    price: 20000,
    turnaroundHours: 1,
    fields: qualitative('H. pylori antigen', NEG_POS),
  },
  {
    code: 'UPT',
    abbreviation: 'HCG',
    name: 'Urine pregnancy test (hCG)',
    category: LabTestCategory.IMMUNOLOGY,
    sampleType: LabSampleType.URINE,
    price: 5000,
    turnaroundHours: 1,
    fields: [pick('result', 'hCG', NEG_POS, [], { required: true })],
  },
];
