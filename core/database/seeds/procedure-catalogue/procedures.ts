import { OrderKind } from 'src/orders/enums/order-kind.enum';
import { ProcedureCategory } from 'src/orders/enums/procedure-category.enum';
import {
  ANAESTHESIA,
  COMPLICATIONS,
  finding,
  num,
  pick,
  SeedProcedureTest,
  text,
} from './fields';

const S = OrderKind.SURGERY;
const req = { required: true };
const g = (group: string) => ({ group });

const outcome = () =>
  finding('outcome', 'Outcome', ['Uncomplicated', 'Complicated'], {
    ...req,
    ...g('Outcome'),
  });
const complications = () =>
  finding('complications', 'Complications', COMPLICATIONS, {
    ...req,
    ...g('Outcome'),
  });
const aftercare = () =>
  text('aftercare', 'Aftercare instructions', g('Outcome'));
const site = () => text('site', 'Site', { ...req, ...g('Procedure') });
const done = () =>
  text('procedure', 'Procedure performed', { ...req, ...g('Procedure') });
const anaesthesia = () =>
  pick('anaesthesia', 'Anaesthesia', ANAESTHESIA, [], {
    ...req,
    ...g('Procedure'),
  });

const bedside = (
  code: string,
  name: string,
  price: number,
  minutes: number,
  category: ProcedureCategory,
): SeedProcedureTest => ({
  code,
  name,
  kind: S,
  category,
  price,
  durationMinutes: minutes,
  fields: [site(), done(), complications(), outcome(), aftercare()],
});

const major = (
  code: string,
  name: string,
  price: number,
  minutes: number,
): SeedProcedureTest => ({
  code,
  name,
  description: 'Starting fee; the final charge can be adjusted on the invoice.',
  kind: S,
  category: ProcedureCategory.MAJOR_SURGERY,
  price,
  durationMinutes: minutes,
  preparation: 'Nothing to eat or drink for 8 hours before surgery.',
  fields: [
    text('surgeon', 'Surgeon', { ...req, ...g('Team') }),
    text('assistant', 'Assistant', g('Team')),
    anaesthesia(),
    text('findings', 'Operative findings', g('Procedure')),
    done(),
    num('duration', 'Duration', 'minutes', [], g('Procedure')),
    num('blood_loss', 'Estimated blood loss', 'mL', [], g('Procedure')),
    pick(
      'specimen',
      'Specimen sent to the lab',
      ['No', 'Yes'],
      [],
      g('Procedure'),
    ),
    complications(),
    outcome(),
    text('post_op', 'Post-operative plan', g('Outcome')),
  ],
});

export const PROCEDURE_CATALOGUE: SeedProcedureTest[] = [
  bedside(
    'PR-DRESS',
    'Wound dressing',
    15000,
    15,
    ProcedureCategory.MINOR_PROCEDURE,
  ),
  bedside(
    'PR-SUTURE',
    'Suturing, minor wound',
    40000,
    30,
    ProcedureCategory.MINOR_PROCEDURE,
  ),
  bedside(
    'PR-ID',
    'Incision and drainage (abscess)',
    70000,
    30,
    ProcedureCategory.MINOR_SURGERY,
  ),
  bedside(
    'PR-POP',
    'POP / plaster cast',
    70000,
    40,
    ProcedureCategory.MINOR_PROCEDURE,
  ),
  {
    code: 'PR-NEB',
    name: 'Nebulisation',
    kind: S,
    category: ProcedureCategory.MINOR_PROCEDURE,
    price: 20000,
    durationMinutes: 20,
    fields: [
      text('drug', 'Drug and dose given', { ...req, ...g('Procedure') }),
      finding('response', 'Response', ['Improved', 'No change', 'Worse'], {
        ...req,
        ...g('Outcome'),
      }),
      aftercare(),
    ],
  },
  {
    code: 'PR-CATH',
    name: 'Urinary catheterisation',
    kind: S,
    category: ProcedureCategory.MINOR_PROCEDURE,
    price: 40000,
    durationMinutes: 20,
    fields: [
      pick('type', 'Catheter', ['Foley', 'Intermittent'], [], {
        ...req,
        ...g('Procedure'),
      }),
      text('size', 'Size (Fr)', g('Procedure')),
      text('urine', 'Urine drained', g('Procedure')),
      complications(),
      aftercare(),
    ],
  },
  {
    code: 'PR-CIRC',
    name: 'Circumcision',
    kind: S,
    category: ProcedureCategory.MINOR_SURGERY,
    price: 100000,
    durationMinutes: 40,
    fields: [
      pick('technique', 'Technique', ['Surgical', 'Clamp', 'Other'], [], {
        ...req,
        ...g('Procedure'),
      }),
      anaesthesia(),
      complications(),
      outcome(),
      aftercare(),
    ],
  },
  bedside(
    'PR-EXCISE',
    'Minor excision (lump, cyst)',
    150000,
    45,
    ProcedureCategory.MINOR_SURGERY,
  ),
  bedside(
    'PR-EXTRACT',
    'Tooth extraction',
    40000,
    30,
    ProcedureCategory.MINOR_PROCEDURE,
  ),
  major('SG-DNC', 'D&C (dilatation and curettage)', 450000, 45),
  major('SG-HERNIA', 'Hernia repair', 1000000, 90),
  major('SG-APPEND', 'Appendicectomy', 1300000, 90),
  major('SG-CS', 'Caesarean section', 1500000, 75),
];
