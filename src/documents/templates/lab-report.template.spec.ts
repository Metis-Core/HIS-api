import { Gender } from 'common/enums/gender.enum';
import type { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabOrderItemStatus as S } from 'src/lab/enums/lab-order-item-status.enum';
import type { Patient } from 'src/patients/entities/patient.entity';
import { renderLabReport } from './lab-report.template';

const patient = {
  firstName: 'Amina',
  lastName: 'Nakato',
  mrn: 'MRN-1',
  gender: Gender.FEMALE,
  dateOfBirth: '1990-01-01',
} as Patient;
const hb = {
  code: 'HB',
  name: 'Haemoglobin',
  resultSchema: {
    fields: [
      {
        key: 'hb',
        label: 'Hb',
        type: 'number',
        ranges: [{ low: 12, high: 16 }],
      },
    ],
  },
};
const item = (id: string, status: S, extra: object = {}) => ({
  id,
  status,
  test: hb,
  resultData: { hb: 10.1 },
  resultFlags: { hb: 'low' },
  resultNotes: null,
  verifiedBy: status === S.VERIFIED ? { username: 'lab.sarah' } : null,
  verifiedAt: status === S.VERIFIED ? new Date('2026-10-18T07:00:00Z') : null,
  ...extra,
});
const order = (items: object[], extra: object = {}) =>
  ({
    id: 'aaaaaaaa-0000-0000-0000-000000000000',
    createdAt: new Date('2026-10-18T06:00:00Z'),
    orderedBy: { username: 'dr.okot' },
    referringClinician: null,
    clinicalNotes: null,
    items,
    ...extra,
  }) as unknown as LabOrder;

describe('renderLabReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs off a fully verified report with the verifier and no preliminary banner', () => {
    // Arrange
    const orders = [order([item('i1', S.VERIFIED)])];

    // Act
    const mjml = renderLabReport({
      patient,
      orders,
      amendedItemIds: new Set(),
    });

    // Assert
    expect(mjml).toContain('Verified by: <strong>lab.sarah');
    expect(mjml).not.toContain('PRELIMINARY');
    expect(mjml).toContain('Signature:');
  });

  it('marks the report preliminary while a result awaits verification', () => {
    // Arrange
    const orders = [
      order([item('i1', S.VERIFIED), item('i2', S.RESULT_READY)]),
    ];

    // Act
    const mjml = renderLabReport({
      patient,
      orders,
      amendedItemIds: new Set(),
    });

    // Assert
    expect(mjml).toContain('PRELIMINARY');
    expect(mjml).toContain('Not yet verified');
  });

  it('leaves out cancelled tests and tags amended ones', () => {
    // Arrange
    const orders = [
      order([
        item('i1', S.VERIFIED),
        item('i9', S.CANCELLED, { test: { ...hb, name: 'Dropped' } }),
      ]),
    ];

    // Act
    const mjml = renderLabReport({
      patient,
      orders,
      amendedItemIds: new Set(['i1']),
    });

    // Assert
    expect(mjml).not.toContain('Dropped');
    expect(mjml).toContain('<strong>Amended</strong>');
  });

  it('names the outside clinician on a walk-in and escapes free text', () => {
    // Arrange
    const orders = [
      order([item('i1', S.VERIFIED)], {
        referringClinician: 'Dr <b>Mugisha</b>',
      }),
    ];

    // Act
    const mjml = renderLabReport({
      patient,
      orders,
      amendedItemIds: new Set(),
    });

    // Assert
    expect(mjml).toContain('requested by Dr &lt;b&gt;Mugisha&lt;/b&gt;');
  });
});
