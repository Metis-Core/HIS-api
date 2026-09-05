require('ts-node/register');
require('tsconfig-paths/register');
const { renderLabOrderReport } = require('./src/documents/templates/lab-order.template.ts');
const mjml2html = require('mjml');

const fakeOrder = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  priority: 'routine',
  clinicalNotes: 'Fasting sample',
  createdAt: new Date(),
  patient: { firstName: 'Jane', middleName: '', lastName: 'Doe', mrn: 'MRN-001' },
  orderedBy: { username: 'dr.smith' },
  items: [
    { test: { code: 'CBC', name: 'Complete Blood Count', unit: 'g/dL', referenceRange: '12-16' }, resultValue: '13.4', isAbnormal: false, resultedAt: new Date(), resultNotes: null },
  ],
};

const mjml = renderLabOrderReport(fakeOrder);
mjml2html(mjml, { validationLevel: 'soft' }).then((result) => {
  console.log('ERRORS:', (result.errors || []).length);
  console.log('HTML LENGTH:', result.html.length);
  console.log('HAS LOGO IMG:', result.html.includes('data:image/png;base64'));
  console.log('HAS FACILITY NAME:', result.html.includes('Suubi Medical Centre'));
  console.log('HAS VENDOR NAME:', result.html.includes('Metis Analytica'));
}).catch((e) => { console.error('RENDER FAILED', e); process.exit(1); });
