import { Consultation } from 'src/consultation/entities/consultation.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatDate,
} from './shared';
import { clinicalSections } from './discharge-sections';

interface DischargeContext {
  consultation: Consultation;
  labOrders: LabOrder[];
  prescriptions: Prescription[];
}

export function renderDischargeSummary({ consultation, labOrders, prescriptions }: DischargeContext): string {
  const patient = consultation.patient;
  const patientName = patient
    ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')
    : 'Patient';
  const doctor = consultation.doctor?.username ?? '—';

  const labRows = labOrders
    .flatMap((o) =>
      o.items.map(
        (i) => `
          <tr>
            <td class="cell code">${escape(i.test?.code ?? '')}</td>
            <td class="cell">${escape(i.test?.name ?? '')}</td>
            <td class="cell">${escape(i.resultValue ?? '—')}</td>
            <td class="cell">${escape(formatDate(i.resultedAt))}</td>
          </tr>
        `,
      ),
    )
    .join('');

  const rxRows = prescriptions
    .flatMap((p) =>
      p.items.map(
        (i) => `
          <tr>
            <td class="cell">${escape(i.item?.name ?? '')}</td>
            <td class="cell">${escape(i.dosage)}</td>
            <td class="cell">${escape(i.frequency)}</td>
            <td class="cell">${escape(i.duration ?? '—')}</td>
            <td class="cell">${escape(String(i.quantity))}</td>
          </tr>
        `,
      ),
    )
    .join('');

  return `
    <mjml>
      <mj-head>
        <mj-title>Discharge Summary</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader('Discharge Summary')}

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
                <td class="k">Attending</td>
                <td class="v">${escape(doctor)}</td>
                <td class="k">Discharged</td>
                <td class="v">${escape(formatDate(consultation.completedAt ?? consultation.updatedAt))}</td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>

        <mj-section padding="0 24px">
          <mj-column>
            ${clinicalSections(consultation)}
          </mj-column>
        </mj-section>

        ${
          labRows
            ? `<mj-section padding="0 24px">
                <mj-column>
                  <mj-text font-size="12px" font-weight="700" color="#0E6B5C">Laboratory</mj-text>
                  <mj-table>
                    <tr><th>Code</th><th>Test</th><th>Result</th><th>Reported</th></tr>
                    ${labRows}
                  </mj-table>
                </mj-column>
              </mj-section>`
            : ''
        }

        ${
          rxRows
            ? `<mj-section padding="0 24px">
                <mj-column>
                  <mj-text font-size="12px" font-weight="700" color="#0E6B5C">Prescriptions</mj-text>
                  <mj-table>
                    <tr><th>Medication</th><th>Dose</th><th>Freq</th><th>Duration</th><th>Qty</th></tr>
                    ${rxRows}
                  </mj-table>
                </mj-column>
              </mj-section>`
            : ''
        }

        ${documentFooter()}
      </mj-body>
    </mjml>
  `;
}
