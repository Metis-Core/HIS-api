import { num, pick, text } from 'src/lab/results/field-builders';
import type { LabResultSchema } from 'src/lab/results/result-schema.types';

const req = { required: true };
const none = (key: string, label: string, options: string[], group: string) =>
  pick(key, label, options, [options[0]], { group });

/** Delivery record for mother and baby; abnormal answers are flagged for review. */
export const DELIVERY: LabResultSchema = {
  fields: [
    text('delivered_at', 'Date and time of birth', {
      ...req,
      helpText: 'YYYY-MM-DD HH:MM',
      group: 'Birth',
    }),
    num('gestation_weeks', 'Gestation', 'weeks', [{ low: 37, high: 42 }], {
      ...req,
      group: 'Birth',
    }),
    pick(
      'place',
      'Place of birth',
      ['This facility', 'Born before arrival'],
      ['This facility'],
      { group: 'Birth' },
    ),
    pick(
      'mode',
      'Mode of delivery',
      [
        'Spontaneous vaginal',
        'Assisted vaginal (vacuum or forceps)',
        'Caesarean section',
      ],
      ['Spontaneous vaginal'],
      { ...req, group: 'Birth' },
    ),
    text('attended_by', 'Attended by', { group: 'Birth' }),
    pick(
      'third_stage',
      'Third stage',
      ['Active management', 'Physiological'],
      ['Active management'],
      { group: 'Mother' },
    ),
    num(
      'blood_loss_ml',
      'Blood loss',
      'mL',
      [{ high: 500, criticalHigh: 1000 }],
      { group: 'Mother' },
    ),
    pick(
      'tear',
      'Perineal tear',
      ['None', '1st degree', '2nd degree', '3rd degree', '4th degree'],
      ['None', '1st degree'],
      { group: 'Mother' },
    ),
    pick('episiotomy', 'Episiotomy', ['No', 'Yes'], ['No'], {
      group: 'Mother',
    }),
    none(
      'mother_complication',
      'Complications',
      [
        'None',
        'Postpartum haemorrhage',
        'Eclampsia',
        'Obstructed labour',
        'Retained placenta',
        'Sepsis',
        'Other',
      ],
      'Mother',
    ),
    pick(
      'mother_condition',
      'Condition of mother',
      ['Stable', 'Referred', 'Died'],
      ['Stable'],
      { ...req, group: 'Mother' },
    ),
    pick(
      'outcome',
      'Outcome',
      ['Live birth', 'Fresh stillbirth', 'Macerated stillbirth'],
      ['Live birth'],
      { ...req, group: 'Baby' },
    ),
    pick('sex', 'Sex', ['Female', 'Male', 'Ambiguous'], [], {
      ...req,
      group: 'Baby',
    }),
    num(
      'birth_weight_g',
      'Birth weight',
      'g',
      [{ low: 2500, high: 4000, criticalLow: 1500 }],
      { ...req, group: 'Baby' },
    ),
    num('apgar_1', 'Apgar, 1 minute', '/10', [{ low: 7 }], { group: 'Baby' }),
    num('apgar_5', 'Apgar, 5 minutes', '/10', [{ low: 7, criticalLow: 4 }], {
      group: 'Baby',
    }),
    none(
      'resuscitation',
      'Resuscitation',
      ['None', 'Stimulation and suction', 'Bag and mask', 'Other'],
      'Baby',
    ),
    none(
      'baby_complication',
      'Complications',
      [
        'None',
        'Prematurity',
        'Birth asphyxia',
        'Infection',
        'Congenital abnormality',
        'Other',
      ],
      'Baby',
    ),
    pick(
      'breastfed',
      'Breastfeeding started within an hour',
      ['Yes', 'No'],
      ['Yes'],
      { group: 'Baby' },
    ),
    pick(
      'birth_vaccines',
      'BCG, polio and hepatitis B birth doses',
      ['All given', 'Partly given', 'None yet'],
      ['All given'],
      { group: 'Baby' },
    ),
    text('notes', 'Notes', { group: 'Baby' }),
  ],
};
