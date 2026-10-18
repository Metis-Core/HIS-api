import { pick, text } from 'src/lab/results/field-builders';
import type { LabResultSchema } from 'src/lab/results/result-schema.types';
import { VACCINES } from '../vaccines';

const req = { required: true };
const allDoses = [
  'Birth dose',
  'Dose 1',
  'Dose 2',
  'Dose 3',
  'Dose 4',
  'Dose 5',
  'Booster',
];

/** One vaccine given; the form suggests the usual route and site for the chosen vaccine. */
export const IMMUNIZATION: LabResultSchema = {
  fields: [
    pick(
      'vaccine',
      'Vaccine',
      VACCINES.map((vaccine) => vaccine.name),
      [],
      { ...req, group: 'Vaccine' },
    ),
    pick('dose', 'Dose', allDoses, [], { ...req, group: 'Vaccine' }),
    text('batch_number', 'Batch number', { ...req, group: 'Vaccine' }),
    text('expiry_date', 'Expiry date', {
      ...req,
      helpText: 'YYYY-MM-DD',
      group: 'Vaccine',
    }),
    pick(
      'route',
      'Route',
      ['Oral', 'Intradermal', 'Intramuscular', 'Subcutaneous'],
      [],
      { ...req, group: 'Given' },
    ),
    pick(
      'site',
      'Site',
      [
        'Mouth',
        'Right upper arm',
        'Left upper arm',
        'Right thigh',
        'Left thigh',
      ],
      [],
      { ...req, group: 'Given' },
    ),
    pick(
      'reaction',
      'Reaction after the dose',
      ['None', 'Mild local reaction', 'Fever', 'Severe, report'],
      ['None'],
      { group: 'Given' },
    ),
    text('next_due', 'Next dose due', {
      helpText: 'YYYY-MM-DD',
      group: 'Given',
    }),
    text('notes', 'Notes', { group: 'Given' }),
  ],
};
