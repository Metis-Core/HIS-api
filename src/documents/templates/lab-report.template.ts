import type { LabOrder } from 'src/lab/entities/lab-order.entity';
import type { Patient } from 'src/patients/entities/patient.entity';
import { ageInYears } from 'common/utils/age';
import { FLAG_LEGEND } from './lab-result-table';
import {
  isPreliminary,
  reportable,
  signatureBlock,
  testRows,
} from './lab-report-sections';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatDate,
} from './shared';

export interface LabReportInput {
  patient: Patient;
  /** Orders to print, oldest first. */
  orders: LabOrder[];
  /** Item ids whose verified result was later amended. */
  amendedItemIds: ReadonlySet<string>;
}

const fullName = (p: Patient) =>
  [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');

const orderSection = (order: LabOrder, input: LabReportInput) => `
  <mj-section padding="10px 32px 0">
    <mj-column>
      <mj-text font-size="12px" font-weight="700" color="#111827">
        Order ${escape(order.id.slice(0, 8))} · ${escape(formatDate(order.createdAt))} · requested by ${escape(order.referringClinician || order.orderedBy?.username || '—')}
      </mj-text>
      ${order.clinicalNotes ? `<mj-text class="muted">Clinical notes: ${escape(order.clinicalNotes)}</mj-text>` : ''}
      <mj-table>
        <tr><th style="width:22%">Test</th><th>Result</th><th style="width:22%">Status</th></tr>
        ${testRows(order, input.patient, input.amendedItemIds)}
      </mj-table>
    </mj-column>
  </mj-section>`;

/** L7: one lab report for an order or a whole visit, signed off by the verifying staff. */
export function renderLabReport(input: LabReportInput): string {
  const { patient } = input;
  const orders = input.orders.filter((order) => reportable(order).length > 0);
  const preliminary = isPreliminary(orders);
  const age = ageInYears(patient.dateOfBirth, new Date());
  return `
    <mjml>
      <mj-head>
        <mj-title>Laboratory Report</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader(preliminary ? 'Preliminary Lab Report' : 'Laboratory Report')}
        ${
          preliminary
            ? `<mj-section padding="8px 32px"><mj-column><mj-text align="center" class="abnormal">PRELIMINARY: some results are not yet verified and may change.</mj-text></mj-column></mj-section>`
            : ''
        }
        <mj-section padding="18px 32px">
          <mj-column>
            <mj-table>
              <tr class="row"><td class="k">Patient</td><td class="v">${escape(fullName(patient))}</td><td class="k">MRN</td><td class="v">${escape(patient.mrn ?? '—')}</td></tr>
              <tr class="row"><td class="k">Sex</td><td class="v">${escape(patient.gender ?? '—')}</td><td class="k">Age</td><td class="v">${age === null ? '—' : `${age} y`}</td></tr>
            </mj-table>
          </mj-column>
        </mj-section>
        ${orders.map((order) => orderSection(order, input)).join('')}
        <mj-section padding="8px 32px 0"><mj-column><mj-text class="muted">${escape(FLAG_LEGEND)}</mj-text></mj-column></mj-section>
        ${signatureBlock(orders)}
        ${documentFooter()}
      </mj-body>
    </mjml>`;
}
