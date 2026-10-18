import { OrderKind } from 'src/orders/enums/order-kind.enum';
import { ProcedureCategory } from 'src/orders/enums/procedure-category.enum';
import {
  comments,
  finding,
  num,
  pick,
  SeedProcedureTest,
  text,
} from './fields';

const R = OrderKind.RADIOLOGY;
const req = { required: true };
const g = (group: string) => ({ group });
const present = (key: string, label: string, group: string) =>
  finding(key, label, ['None', 'Present'], g(group));
const bones = (extra: string[]) =>
  finding('bones', 'Bones', ['Normal', ...extra], {
    required: true,
    group: 'Findings',
  });

export const XRAYS: SeedProcedureTest[] = [
  {
    code: 'XR-CHEST',
    abbreviation: 'CXR',
    name: 'X-ray, chest',
    kind: R,
    category: ProcedureCategory.XRAY,
    price: 50000,
    durationMinutes: 15,
    preparation: 'Remove metal and jewellery from the chest area.',
    fields: [
      finding(
        'lungs',
        'Lungs',
        [
          'Clear',
          'Consolidation',
          'Effusion',
          'Mass or nodule',
          'Pneumothorax',
          'Other',
        ],
        { ...req, ...g('Findings') },
      ),
      finding('heart', 'Heart size', ['Normal', 'Enlarged'], g('Findings')),
      finding(
        'mediastinum',
        'Mediastinum',
        ['Normal', 'Widened', 'Shifted'],
        g('Findings'),
      ),
      finding(
        'pleura',
        'Pleura and diaphragm',
        ['Normal', 'Abnormal'],
        g('Findings'),
      ),
      finding(
        'bones',
        'Bones and soft tissue',
        ['Normal', 'Abnormal'],
        g('Findings'),
      ),
      comments(),
    ],
  },
  {
    code: 'XR-ABD',
    name: 'X-ray, abdomen',
    kind: R,
    category: ProcedureCategory.XRAY,
    price: 50000,
    durationMinutes: 15,
    fields: [
      finding(
        'gas',
        'Bowel gas pattern',
        ['Normal', 'Obstruction pattern', 'Ileus', 'Other'],
        { ...req, ...g('Findings') },
      ),
      present('free_air', 'Free air under the diaphragm', 'Findings'),
      present('calcifications', 'Calcifications or stones', 'Findings'),
      comments(),
    ],
  },
  {
    code: 'XR-LIMB',
    name: 'X-ray, limb (arm, leg, hand, foot)',
    kind: R,
    category: ProcedureCategory.XRAY,
    price: 40000,
    durationMinutes: 15,
    fields: [
      text('region', 'Region and views', {
        ...req,
        helpText: 'e.g. Right wrist, AP and lateral',
      }),
      bones([
        'Fracture',
        'Dislocation',
        'Lesion',
        'Degenerative changes',
        'Other',
      ]),
      finding(
        'joints',
        'Joints',
        ['Normal', 'Narrowed space', 'Effusion', 'Other'],
        g('Findings'),
      ),
      finding(
        'soft_tissue',
        'Soft tissue',
        ['Normal', 'Swelling', 'Foreign body', 'Other'],
        g('Findings'),
      ),
      comments(),
    ],
  },
  {
    code: 'XR-SPINE',
    name: 'X-ray, spine',
    kind: R,
    category: ProcedureCategory.XRAY,
    price: 70000,
    durationMinutes: 20,
    fields: [
      text('region', 'Region and views', {
        ...req,
        helpText: 'e.g. Lumbar spine, AP and lateral',
      }),
      finding(
        'alignment',
        'Alignment',
        ['Normal', 'Scoliosis', 'Listhesis', 'Other'],
        g('Findings'),
      ),
      finding(
        'vertebrae',
        'Vertebrae',
        ['Normal', 'Fracture', 'Degenerative changes', 'Lesion', 'Other'],
        { ...req, ...g('Findings') },
      ),
      finding(
        'discs',
        'Disc spaces',
        ['Normal', 'Narrowed', 'Other'],
        g('Findings'),
      ),
      comments(),
    ],
  },
  {
    code: 'XR-SKULL',
    name: 'X-ray, skull or sinuses',
    kind: R,
    category: ProcedureCategory.XRAY,
    price: 50000,
    durationMinutes: 15,
    fields: [
      finding('bones', 'Skull bones', ['Normal', 'Fracture', 'Other'], {
        ...req,
        ...g('Findings'),
      }),
      finding(
        'sinuses',
        'Sinuses',
        ['Clear', 'Opacified', 'Fluid level'],
        g('Findings'),
      ),
      comments(),
    ],
  },
  {
    code: 'XR-PELVIS',
    name: 'X-ray, pelvis or hip',
    kind: R,
    category: ProcedureCategory.XRAY,
    price: 60000,
    durationMinutes: 15,
    fields: [
      bones(['Fracture', 'Dislocation', 'Lesion', 'Other']),
      finding(
        'joints',
        'Hip joints',
        ['Normal', 'Narrowed', 'Other'],
        g('Findings'),
      ),
      comments(),
    ],
  },
];

export const ULTRASOUNDS: SeedProcedureTest[] = [
  {
    code: 'US-ABD',
    name: 'Ultrasound, abdomen',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 50000,
    durationMinutes: 30,
    preparation: 'Do not eat for 6 hours before the scan. Water is allowed.',
    fields: [
      finding(
        'liver',
        'Liver',
        ['Normal', 'Fatty', 'Enlarged', 'Mass', 'Other'],
        { ...req, ...g('Organs') },
      ),
      finding(
        'gallbladder',
        'Gallbladder',
        ['Normal', 'Stones', 'Wall thickening', 'Other'],
        g('Organs'),
      ),
      finding('biliary', 'Bile ducts', ['Normal', 'Dilated'], g('Organs')),
      finding('spleen', 'Spleen', ['Normal', 'Enlarged', 'Other'], g('Organs')),
      finding(
        'pancreas',
        'Pancreas',
        ['Normal', 'Abnormal', 'Not seen'],
        g('Organs'),
      ),
      finding(
        'kidneys',
        'Kidneys',
        ['Normal', 'Hydronephrosis', 'Stones', 'Cyst', 'Other'],
        g('Organs'),
      ),
      finding('free_fluid', 'Free fluid', ['None', 'Present'], g('Organs')),
      comments(),
    ],
  },
  {
    code: 'US-OB',
    abbreviation: 'Obstetric scan',
    name: 'Ultrasound, obstetric',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 40000,
    durationMinutes: 30,
    preparation: 'Come with a comfortably full bladder.',
    fields: [
      num('fetuses', 'Number of fetuses', '', [], {
        ...req,
        ...g('Pregnancy'),
      }),
      num('gest_weeks', 'Gestational age', 'weeks', [], {
        ...req,
        ...g('Pregnancy'),
      }),
      text('edd', 'Expected delivery date', g('Pregnancy')),
      finding('fetal_heart', 'Fetal heart activity', ['Present', 'Absent'], {
        ...req,
        ...g('Fetus'),
      }),
      finding(
        'presentation',
        'Presentation',
        ['Cephalic', 'Breech', 'Transverse', 'Not applicable'],
        g('Fetus'),
      ),
      num('est_weight', 'Estimated fetal weight', 'g', [], g('Fetus')),
      pick(
        'placenta',
        'Placenta',
        ['Fundal', 'Anterior', 'Posterior', 'Low-lying', 'Praevia'],
        ['Fundal', 'Anterior', 'Posterior'],
        g('Fetus'),
      ),
      finding(
        'liquor',
        'Amniotic fluid',
        ['Normal', 'Reduced', 'Increased'],
        g('Fetus'),
      ),
      comments(),
    ],
  },
  {
    code: 'US-PELVIC',
    name: 'Ultrasound, pelvic',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 50000,
    durationMinutes: 30,
    preparation: 'Come with a comfortably full bladder.',
    fields: [
      finding('uterus', 'Uterus', ['Normal', 'Fibroids', 'Enlarged', 'Other'], {
        ...req,
        ...g('Pelvis'),
      }),
      text('endometrium', 'Endometrial thickness', g('Pelvis')),
      finding(
        'ovaries',
        'Ovaries',
        ['Normal', 'Cyst', 'Mass', 'Polycystic appearance', 'Other'],
        g('Pelvis'),
      ),
      finding('free_fluid', 'Free fluid', ['None', 'Present'], g('Pelvis')),
      finding('bladder', 'Bladder', ['Normal', 'Abnormal'], g('Pelvis')),
      comments(),
    ],
  },
  {
    code: 'US-BREAST',
    name: 'Ultrasound, breast',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 70000,
    durationMinutes: 30,
    fields: [
      pick('side', 'Side', ['Right', 'Left', 'Both'], [], {
        ...req,
        ...g('Findings'),
      }),
      finding(
        'lesion',
        'Lesion',
        ['None seen', 'Solid lesion', 'Cystic lesion', 'Other'],
        { ...req, ...g('Findings') },
      ),
      num('size_mm', 'Largest lesion size', 'mm', [], g('Findings')),
      text('location', 'Location of the lesion', g('Findings')),
      finding(
        'nodes',
        'Axillary lymph nodes',
        ['Normal', 'Enlarged'],
        g('Findings'),
      ),
      comments(),
    ],
  },
  {
    code: 'US-THYROID',
    name: 'Ultrasound, thyroid',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 70000,
    durationMinutes: 20,
    fields: [
      finding('gland', 'Gland', ['Normal', 'Enlarged', 'Diffuse change'], {
        ...req,
        ...g('Findings'),
      }),
      finding(
        'nodules',
        'Nodules',
        ['None', 'Single nodule', 'Multiple nodules'],
        g('Findings'),
      ),
      num('size_mm', 'Largest nodule size', 'mm', [], g('Findings')),
      comments(),
    ],
  },
  {
    code: 'US-SCROTAL',
    name: 'Ultrasound, scrotal',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 60000,
    durationMinutes: 20,
    fields: [
      finding('testes', 'Testes', ['Normal', 'Mass', 'Atrophic', 'Absent'], {
        ...req,
        ...g('Findings'),
      }),
      finding(
        'epididymis',
        'Epididymis',
        ['Normal', 'Swollen', 'Cyst'],
        g('Findings'),
      ),
      finding('hydrocele', 'Hydrocele', ['None', 'Present'], g('Findings')),
      finding('varicocele', 'Varicocele', ['None', 'Present'], g('Findings')),
      comments(),
    ],
  },
  {
    code: 'US-DOPPLER',
    name: 'Doppler ultrasound',
    kind: R,
    category: ProcedureCategory.ULTRASOUND,
    price: 120000,
    durationMinutes: 45,
    fields: [
      text('vessel', 'Vessels examined', {
        ...req,
        helpText: 'e.g. Left leg deep veins',
      }),
      finding('flow', 'Flow', ['Normal', 'Reduced', 'Absent'], {
        ...req,
        ...g('Findings'),
      }),
      finding('thrombus', 'Thrombus', ['None', 'Present'], g('Findings')),
      finding('reflux', 'Reflux', ['None', 'Present'], g('Findings')),
      comments(),
    ],
  },
];

export const CARDIAC_AND_CT: SeedProcedureTest[] = [
  {
    code: 'ECG',
    name: 'ECG',
    kind: R,
    category: ProcedureCategory.ECG,
    price: 40000,
    durationMinutes: 15,
    fields: [
      num(
        'rate',
        'Heart rate',
        'bpm',
        [{ low: 60, high: 100, criticalLow: 40, criticalHigh: 150 }],
        { ...req, ...g('Tracing') },
      ),
      finding(
        'rhythm',
        'Rhythm',
        ['Sinus rhythm', 'Atrial fibrillation', 'Other arrhythmia'],
        { ...req, ...g('Tracing') },
      ),
      finding(
        'axis',
        'Axis',
        ['Normal', 'Left deviation', 'Right deviation'],
        g('Tracing'),
      ),
      finding(
        'st',
        'ST segment',
        ['Normal', 'ST elevation', 'ST depression'],
        g('Tracing'),
      ),
      text('intervals', 'Intervals (PR, QRS, QT)', g('Tracing')),
      comments(),
    ],
  },
  {
    code: 'ECHO',
    name: 'Echocardiogram',
    kind: R,
    category: ProcedureCategory.ECHO,
    price: 200000,
    durationMinutes: 45,
    fields: [
      num(
        'ef',
        'Ejection fraction',
        '%',
        [{ low: 55, high: 70, criticalLow: 30 }],
        { ...req, ...g('Heart') },
      ),
      finding(
        'lv',
        'Left ventricle',
        ['Normal', 'Dilated', 'Hypertrophied'],
        g('Heart'),
      ),
      finding('valves', 'Valves', ['Normal', 'Abnormal'], g('Heart')),
      finding(
        'pericardium',
        'Pericardium',
        ['No effusion', 'Effusion'],
        g('Heart'),
      ),
      comments(),
    ],
  },
  {
    code: 'CT-HEAD',
    name: 'CT scan, head',
    description:
      'Referral to a partner scan centre; the report is entered here.',
    kind: R,
    category: ProcedureCategory.CT,
    price: 380000,
    durationMinutes: 30,
    fields: [
      pick('contrast', 'Contrast', ['None', 'IV contrast'], [], g('Technique')),
      finding('bleed', 'Bleed', ['None', 'Present'], {
        ...req,
        ...g('Findings'),
      }),
      finding('mass', 'Mass', ['None', 'Present'], g('Findings')),
      finding('shift', 'Midline shift', ['None', 'Present'], g('Findings')),
      finding('skull', 'Skull', ['Normal', 'Fracture'], g('Findings')),
      comments(),
    ],
  },
  {
    code: 'CT-BODY',
    name: 'CT scan, chest or abdomen',
    description:
      'Referral to a partner scan centre; the report is entered here.',
    kind: R,
    category: ProcedureCategory.CT,
    price: 500000,
    durationMinutes: 40,
    fields: [
      pick('region', 'Region', ['Chest', 'Abdomen', 'Chest and abdomen'], [], {
        ...req,
        ...g('Technique'),
      }),
      pick('contrast', 'Contrast', ['None', 'IV contrast'], [], g('Technique')),
      finding('result', 'Overall', ['No acute abnormality', 'Abnormal'], {
        ...req,
        ...g('Findings'),
      }),
      comments(),
    ],
  },
];

export const RADIOLOGY_CATALOGUE: SeedProcedureTest[] = [
  ...XRAYS,
  ...ULTRASOUNDS,
  ...CARDIAC_AND_CT,
];
