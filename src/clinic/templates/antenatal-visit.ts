import { num, pick, text } from 'src/lab/results/field-builders';
import type { LabResultSchema } from 'src/lab/results/result-schema.types';

const req = { required: true };
const none = (key: string, label: string, options: string[], group: string) =>
  pick(key, label, options, [options[0]], { group });

/** Antenatal contact (WHO eight-contact model, as on the Uganda ANC card); flagged values are danger signs to follow up. */
export const ANTENATAL_VISIT: LabResultSchema = {
  fields: [
    pick(
      'contact',
      'ANC contact number',
      ['1', '2', '3', '4', '5', '6', '7', '8 or more'],
      [],
      { ...req, group: 'Visit' },
    ),
    num('gestation_weeks', 'Gestation', 'weeks', [], {
      ...req,
      group: 'Visit',
    }),
    text('lmp', 'Last menstrual period', {
      helpText: 'YYYY-MM-DD',
      group: 'Visit',
    }),
    text('edd', 'Expected date of delivery', {
      helpText: 'YYYY-MM-DD',
      group: 'Visit',
    }),
    num('weight_kg', 'Weight', 'kg', [], { group: 'Examination' }),
    num(
      'bp_systolic',
      'Blood pressure, systolic',
      'mmHg',
      [{ low: 90, high: 139, criticalHigh: 160 }],
      { ...req, group: 'Examination' },
    ),
    num(
      'bp_diastolic',
      'Blood pressure, diastolic',
      'mmHg',
      [{ low: 60, high: 89, criticalHigh: 110 }],
      { ...req, group: 'Examination' },
    ),
    num('fundal_height_cm', 'Fundal height', 'cm', [], {
      group: 'Examination',
    }),
    num(
      'fetal_heart_rate',
      'Fetal heart rate',
      'bpm',
      [{ low: 110, high: 160, criticalLow: 100, criticalHigh: 180 }],
      { group: 'Examination' },
    ),
    pick(
      'presentation',
      'Fetal presentation',
      ['Cephalic', 'Not yet determined', 'Breech', 'Transverse'],
      ['Cephalic', 'Not yet determined'],
      { group: 'Examination' },
    ),
    pick(
      'fetal_movement',
      'Fetal movement',
      ['Present', 'Not yet felt', 'Reduced', 'Absent'],
      ['Present', 'Not yet felt'],
      { group: 'Examination' },
    ),
    none(
      'oedema',
      'Swelling (oedema)',
      ['None', 'Mild', 'Severe'],
      'Examination',
    ),
    none('pallor', 'Pallor', ['None', 'Mild', 'Severe'], 'Examination'),
    num('hb_gdl', 'Haemoglobin', 'g/dL', [{ low: 11, criticalLow: 7 }], {
      group: 'Tests',
    }),
    pick(
      'urine_protein',
      'Urine protein',
      ['Negative', 'Trace', '+', '++', '+++'],
      ['Negative', 'Trace'],
      { group: 'Tests' },
    ),
    pick(
      'hiv',
      'HIV status',
      [
        'Negative',
        'Positive, on ART',
        'Positive, newly diagnosed',
        'Not tested',
        'Declined',
      ],
      ['Negative'],
      { group: 'Tests' },
    ),
    pick(
      'syphilis',
      'Syphilis',
      ['Negative', 'Positive', 'Not tested'],
      ['Negative', 'Not tested'],
      { group: 'Tests' },
    ),
    pick(
      'malaria_rdt',
      'Malaria test',
      ['Negative', 'Positive', 'Not tested'],
      ['Negative', 'Not tested'],
      { group: 'Tests' },
    ),
    text('blood_group', 'Blood group and rhesus', { group: 'Tests' }),
    pick(
      'iptp',
      'Malaria prevention (IPTp)',
      ['Not due', 'Dose 1', 'Dose 2', 'Dose 3', 'Dose 4 or more'],
      [],
      { group: 'Care given' },
    ),
    pick(
      'iron_folic',
      'Iron and folic acid',
      ['Given', 'Not given'],
      ['Given'],
      { group: 'Care given' },
    ),
    pick(
      'td',
      'Tetanus-diphtheria (Td)',
      [
        'Dose 1',
        'Dose 2',
        'Dose 3',
        'Dose 4',
        'Dose 5',
        'Up to date',
        'Not given',
      ],
      [],
      { group: 'Care given' },
    ),
    pick('itn', 'Mosquito net', ['Given', 'Already has one', 'Not given'], [], {
      group: 'Care given',
    }),
    pick('deworming', 'Deworming', ['Given', 'Not due', 'Not given'], [], {
      group: 'Care given',
    }),
    none(
      'danger_signs',
      'Danger signs',
      [
        'None',
        'Vaginal bleeding',
        'Severe headache or blurred vision',
        'Convulsions',
        'Fever',
        'Reduced fetal movement',
        'Other',
      ],
      'Assessment',
    ),
    pick(
      'risk',
      'Risk status',
      ['Low risk', 'High risk, refer'],
      ['Low risk'],
      { ...req, group: 'Assessment' },
    ),
    text('next_visit', 'Next visit', {
      helpText: 'YYYY-MM-DD',
      group: 'Assessment',
    }),
    text('notes', 'Notes', { group: 'Assessment' }),
  ],
};
