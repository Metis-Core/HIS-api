import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatDate,
} from './shared';

export function renderPrescription(prescription: Prescription): string {
  const patient = prescription.patient;
  const patientName = patient
    ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')
    : 'Patient';
  const prescriber = prescription.prescribedBy?.username ?? '—';

  const itemsHtml = prescription.items
    .map(
      (item) => `
        <tr>
          <td class="cell code">${escape(item.item?.sku ?? '')}</td>
          <td class="cell">
            ${escape(item.item?.name ?? '—')}
            ${item.item?.strength ? `<span class="muted"> · ${escape(item.item.strength)}</span>` : ''}
            ${item.item?.dosageForm ? `<span class="muted"> · ${escape(item.item.dosageForm)}</span>` : ''}
          </td>
          <td class="cell">${escape(item.dosage)}</td>
          <td class="cell">${escape(item.frequency)}</td>
          <td class="cell">${escape(item.duration ?? '—')}</td>
          <td class="cell">${escape(String(item.quantity))}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <mjml>
      <mj-head>
        <mj-title>Prescription</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader('Prescription')}

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
                <td class="k">Prescription #</td>
                <td class="v code">${escape(prescription.id.slice(0, 8))}</td>
                <td class="k">Status</td>
                <td class="v">${escape(prescription.status)}</td>
              </tr>
              <tr class="row">
                <td class="k">Prescribed by</td>
                <td class="v">${escape(prescriber)}</td>
                <td class="k">Issued</td>
                <td class="v">${escape(formatDate(prescription.createdAt))}</td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>

        <mj-section padding="0 24px">
          <mj-column>
            <mj-text font-size="12px" font-weight="700" color="#0E6B5C">Rx items</mj-text>
            <mj-table>
              <tr>
                <th>SKU</th>
                <th>Medication</th>
                <th>Dose</th>
                <th>Freq</th>
                <th>Duration</th>
                <th>Qty</th>
              </tr>
              ${itemsHtml}
            </mj-table>
          </mj-column>
        </mj-section>

        ${
          prescription.notes
            ? `<mj-section padding="12px 24px">
                <mj-column>
                  <mj-text class="label">Notes</mj-text>
                  <mj-text>${escape(prescription.notes)}</mj-text>
                </mj-column>
              </mj-section>`
            : ''
        }

        <mj-section padding="24px 24px 0 24px">
          <mj-column>
            <mj-text font-size="10px" color="#5B6572">
              Provider signature: ______________________________
            </mj-text>
          </mj-column>
        </mj-section>

        ${documentFooter()}
      </mj-body>
    </mjml>
  `;
}
