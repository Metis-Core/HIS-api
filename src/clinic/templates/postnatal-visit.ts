import { num, pick, text } from 'src/lab/results/field-builders';
import type { LabResultSchema } from 'src/lab/results/result-schema.types';

const req = { required: true };

/** Postnatal check of mother and baby; flagged answers need follow-up. */
export const POSTNATAL_VISIT: LabResultSchema = {
  fields: [
    num('days_since_birth', 'Days since birth', 'days', [], {
      ...req,
      group: 'Visit',
    }),
    num(
      'bp_systolic',
      'Mother, blood pressure systolic',
      'mmHg',
      [{ low: 90, high: 139, criticalHigh: 160 }],
      { group: 'Mother' },
    ),
    num(
      'bp_diastolic',
      'Mother, blood pressure diastolic',
      'mmHg',
      [{ low: 60, high: 89, criticalHigh: 110 }],
      { group: 'Mother' },
    ),
    num(
      'temperature_c',
      'Mother, temperature',
      '°C',
      [{ low: 36, high: 37.5, criticalHigh: 39 }],
      { group: 'Mother' },
    ),
    pick(
      'uterus',
      'Uterus',
      ['Well contracted', 'Poorly contracted'],
      ['Well contracted'],
      { group: 'Mother' },
    ),
    pick('lochia', 'Lochia', ['Normal', 'Heavy', 'Foul-smelling'], ['Normal'], {
      group: 'Mother',
    }),
    pick(
      'wound',
      'Wound or tear',
      ['Healed', 'Not applicable', 'Infected'],
      ['Healed', 'Not applicable'],
      { group: 'Mother' },
    ),
    pick('breasts', 'Breasts', ['Normal', 'Engorged', 'Mastitis'], ['Normal'], {
      group: 'Mother',
    }),
    pick(
      'mother_danger',
      'Danger signs',
      [
        'None',
        'Heavy bleeding',
        'Fever',
        'Severe headache',
        'Convulsions',
        'Other',
      ],
      ['None'],
      { group: 'Mother' },
    ),
    num('baby_weight_g', 'Baby, weight', 'g', [], { group: 'Baby' }),
    pick(
      'cord',
      'Cord',
      ['Clean and dry', 'Fallen off', 'Red or discharging'],
      ['Clean and dry', 'Fallen off'],
      { group: 'Baby' },
    ),
    pick(
      'feeding',
      'Feeding',
      ['Exclusive breastfeeding', 'Mixed feeding', 'Replacement feeding'],
      ['Exclusive breastfeeding'],
      { group: 'Baby' },
    ),
    pick('jaundice', 'Jaundice', ['None', 'Mild', 'Severe'], ['None'], {
      group: 'Baby',
    }),
    pick(
      'baby_danger',
      'Danger signs',
      [
        'None',
        'Not feeding',
        'Fever or cold',
        'Fast breathing',
        'Convulsions',
        'Other',
      ],
      ['None'],
      { group: 'Baby' },
    ),
    pick(
      'family_planning',
      'Family planning',
      ['Counselled', 'Method given', 'Declined'],
      [],
      { group: 'Plan' },
    ),
    text('next_visit', 'Next visit', { helpText: 'YYYY-MM-DD', group: 'Plan' }),
    text('notes', 'Notes', { group: 'Plan' }),
  ],
};
