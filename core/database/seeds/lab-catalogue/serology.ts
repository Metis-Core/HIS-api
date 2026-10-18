import { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import { NEG_POS, NONREACTIVE, pick, qualitative, SeedLabTest } from './fields';

const I = LabTestCategory.IMMUNOLOGY;
const B = LabSampleType.BLOOD;
const TITRES = ['< 1:20', '1:20', '1:40', '1:80', '1:160', '1:320'];
const lowTitres = TITRES.slice(0, 3);

export const SEROLOGY: SeedLabTest[] = [
  {
    code: 'HIV',
    name: 'HIV 1/2 rapid antibody test',
    category: I,
    sampleType: B,
    price: 0,
    turnaroundHours: 1,
    description:
      'Follow the national HIV testing algorithm; record each kit separately if required.',
    fields: qualitative('HIV 1/2 antibodies', NONREACTIVE),
  },
  {
    code: 'HBSAG',
    abbreviation: 'HEP B',
    name: 'Hepatitis B surface antigen',
    category: I,
    sampleType: B,
    price: 10000,
    turnaroundHours: 1,
    fields: qualitative('HBsAg', NEG_POS),
  },
  {
    code: 'HCV',
    abbreviation: 'HEP C',
    name: 'Hepatitis C antibody',
    category: I,
    sampleType: B,
    price: 15000,
    turnaroundHours: 1,
    fields: qualitative('Anti-HCV', NEG_POS),
  },
  {
    code: 'RPR',
    abbreviation: 'VDRL',
    name: 'Syphilis screening (RPR/VDRL)',
    category: I,
    sampleType: B,
    price: 5000,
    turnaroundHours: 1,
    fields: qualitative('RPR', NONREACTIVE),
  },
  {
    code: 'TPHA',
    name: 'Treponema pallidum haemagglutination',
    category: I,
    sampleType: B,
    price: 15000,
    turnaroundHours: 2,
    fields: qualitative('TPHA', NONREACTIVE),
  },
  {
    code: 'WIDAL',
    name: 'Widal test (Salmonella typhi O and H)',
    category: I,
    sampleType: B,
    price: 8000,
    turnaroundHours: 1,
    fields: [
      pick('o_titre', 'S. typhi O titre', TITRES, lowTitres, {
        required: true,
      }),
      pick('h_titre', 'S. typhi H titre', TITRES, lowTitres, {
        required: true,
      }),
    ],
  },
  {
    code: 'TYPHOID-RDT',
    abbreviation: 'TYPHIDOT',
    name: 'Typhoid IgG/IgM rapid test',
    category: I,
    sampleType: B,
    price: 15000,
    turnaroundHours: 1,
    fields: qualitative('Typhoid IgG/IgM', [
      'Negative',
      'IgM positive',
      'IgG positive',
      'IgG and IgM positive',
    ]),
  },
  {
    code: 'HPYLORI-AB',
    name: 'Helicobacter pylori antibody',
    category: I,
    sampleType: B,
    price: 15000,
    turnaroundHours: 1,
    fields: qualitative('H. pylori antibodies', NEG_POS),
  },
  {
    code: 'BRUCELLA',
    abbreviation: 'BAT',
    name: 'Brucella antibody test',
    category: I,
    sampleType: B,
    price: 15000,
    turnaroundHours: 2,
    fields: qualitative('Brucella', NEG_POS),
  },
  {
    code: 'RF',
    name: 'Rheumatoid factor',
    category: I,
    sampleType: B,
    price: 15000,
    turnaroundHours: 2,
    fields: qualitative('Rheumatoid factor', NEG_POS),
  },
  {
    code: 'CRAG',
    name: 'Cryptococcal antigen (serum)',
    category: I,
    sampleType: B,
    price: 20000,
    turnaroundHours: 1,
    fields: qualitative('CrAg', NEG_POS),
  },
];
