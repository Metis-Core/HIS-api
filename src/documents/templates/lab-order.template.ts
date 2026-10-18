import { LabOrder } from 'src/lab/entities/lab-order.entity';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatDate,
} from './shared';
import { renderResultTable } from './lab-result-table';

export function renderLabOrderReport(order: LabOrder): string {
  const patient = order.patient;
  const patientName = patient
    ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')
    : 'Patient';
  const doctor = order.orderedBy?.username ?? '—';

  const itemsHtml = order.items
    .map((item) => {
      const test = item.test;
      return `
        <tr>
          <td class="cell code">${escape(test?.code ?? '')}</td>
          <td class="cell">${escape(test?.name ?? '')}</td>
          <td class="cell">${renderResultTable(item, patient)}</td>
          <td class="cell">${escape(formatDate(item.resultedAt))}</td>
        </tr>
      `;
    })
    .join('');

  const notesRows = order.items
    .filter((i) => i.resultNotes)
    .map(
      (i) =>
        `<tr><td class="cell code">${escape(i.test?.code ?? '')}</td><td class="cell">${escape(i.resultNotes ?? '')}</td></tr>`,
    )
    .join('');

  return `
    <mjml>
      <mj-head>
        <mj-title>Lab Result Report</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader('Laboratory Result Report')}

        <mj-section padding="18px 24px">
          <mj-column>
            <mj-table>
              <tr class="row">
                <td class="k">Patient</td>
                <td class="v">${escape(patientName)}</td>
                <td class="k">MRN</td>
                <td class="v">${escape(patient?.mrn ?? '—')}</td>
              </tr>
              <tr class="row">
                <td class="k">Order ID</td>
                <td class="v code">${escape(order.id.slice(0, 8))}</td>
                <td class="k">Priority</td>
                <td class="v">${escape(order.priority)}</td>
              </tr>
              <tr class="row">
                <td class="k">Ordered by</td>
                <td class="v">${escape(doctor)}</td>
                <td class="k">Ordered on</td>
                <td class="v">${escape(formatDate(order.createdAt))}</td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>

        <mj-section padding="0 24px">
          <mj-column>
            <mj-text font-size="12px" font-weight="700" color="#0E6B5C">Test results</mj-text>
            <mj-table>
              <tr>
                <th>Code</th>
                <th>Test</th>
                <th>Result</th>
                <th>Reported</th>
              </tr>
              ${itemsHtml}
            </mj-table>
          </mj-column>
        </mj-section>

        ${
          order.clinicalNotes
            ? `<mj-section padding="12px 24px">
                <mj-column>
                  <mj-text class="label">Clinical notes</mj-text>
                  <mj-text>${escape(order.clinicalNotes)}</mj-text>
                </mj-column>
              </mj-section>`
            : ''
        }

        ${
          notesRows
            ? `<mj-section padding="0 24px">
                <mj-column>
                  <mj-text class="label">Result notes</mj-text>
                  <mj-table><tr><th>Code</th><th>Note</th></tr>${notesRows}</mj-table>
                </mj-column>
              </mj-section>`
            : ''
        }

        ${documentFooter()}
      </mj-body>
    </mjml>
  `;
}
