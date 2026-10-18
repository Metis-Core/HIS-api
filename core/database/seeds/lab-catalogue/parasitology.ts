import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import { num, pick, qualitative, SEEN, SeedLabTest, text } from './fields';

const NO_MPS = 'No malaria parasites seen';

export const PARASITOLOGY: SeedLabTest[] = [
  {
    code: 'BS',
    abbreviation: 'MPS',
    name: 'Blood slide for malaria parasites (thick and thin film)',
    category: LabTestCategory.PARASITOLOGY,
    sampleType: LabSampleType.BLOOD,
    price: 5000,
    turnaroundHours: 1,
    fields: [
      pick('method', 'Film', [
        'Thick film',
        'Thin film',
        'Thick and thin film',
      ]),
      pick('result', 'Result', [NO_MPS, 'Malaria parasites seen'], [NO_MPS], {
        required: true,
      }),
      pick('species', 'Species', [
        'Not applicable',
        'P. falciparum',
        'P. malariae',
        'P. ovale',
        'P. vivax',
        'Mixed infection',
      ]),
      pick('grading', 'Grading', ['Not applicable', '+', '++', '+++', '++++']),
      num('density', 'Parasite density', 'parasites/µL', [], {
        helpText: 'Asexual parasites per µL from the thick film',
      }),
      text('stages', 'Stages seen', {
        helpText: 'e.g. ring forms, trophozoites, schizonts',
      }),
      pick('gametocytes', 'Gametocytes', SEEN, ['Not seen']),
      text('other', 'Other findings', {
        helpText: 'e.g. Borrelia, trypanosomes, microfilariae',
      }),
    ],
  },
  {
    code: 'MRDT',
    abbreviation: 'RDT',
    name: 'Malaria rapid diagnostic test',
    category: LabTestCategory.PARASITOLOGY,
    sampleType: LabSampleType.BLOOD,
    price: 5000,
    turnaroundHours: 1,
    fields: qualitative('mRDT', [
      'Negative',
      'P. falciparum positive',
      'Pan (non-falciparum) positive',
      'P. falciparum and Pan positive',
      'Invalid',
    ]),
  },
];
