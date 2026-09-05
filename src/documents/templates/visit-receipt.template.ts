import { Consultation } from 'src/consultation/entities/consultation.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatCurrency,
  formatDate,
} from './shared';

interface VisitReceiptContext {
  visit: Visit;
  consultations: Consultation[];
  labOrders: LabOrder[];
  prescriptions: Prescription[];
}

interface LineItem {
  code: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export function renderVisitReceipt({ visit, consultations, labOrders, prescriptions }: VisitReceiptContext): string {
  const patient = visit.patient;
  const patientName = patient
    ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')
    : 'Patient';

  const lines: LineItem[] = [];

  for (const c of consultations) {
    lines.push({
      code: `CONS-${c.id.slice(0, 6)}`,
      label: `${c.type.replaceAll('_', ' ')} consultation — ${c.chiefComplaint}`,
      qty: 1,
      unitPrice: 0,
      total: 0,
    });
  }

  for (const o of labOrders) {
    for (const i of o.items) {
      lines.push({
        code: i.test?.code ?? '',
        label: `Lab: ${i.test?.name ?? 'Test'}`,
        qty: 1,
        unitPrice: i.test?.price ?? 0,
        total: i.test?.price ?? 0,
      });
    }
  }

  for (const p of prescriptions) {
    for (const i of p.items) {
      const unit = i.item?.unitPrice ?? 0;
      lines.push({
        code: i.item?.sku ?? '',
        label: `Rx: ${i.item?.name ?? 'Item'} · ${i.dosage} · ${i.frequency}`,
        qty: i.quantity,
        unitPrice: unit,
        total: unit * i.quantity,
      });
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  const rows = lines
    .map(
      (l) => `
        <tr>
          <td class="cell code">${escape(l.code)}</td>
          <td class="cell">${escape(l.label)}</td>
          <td class="cell">${escape(String(l.qty))}</td>
          <td class="cell">${escape(formatCurrency(l.unitPrice))}</td>
          <td class="cell">${escape(formatCurrency(l.total))}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <mjml>
      <mj-head>
        <mj-title>Visit Receipt</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader('Visit Receipt')}

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
                <td class="k">Visit</td>
                <td class="v code">${escape(visit.id.slice(0, 8))}</td>
                <td class="k">Type</td>
                <td class="v">${escape(visit.visitType)}</td>
              </tr>
              <tr class="row">
                <td class="k">Opened</td>
                <td class="v">${escape(formatDate(visit.createdAt))}</td>
                <td class="k">Status</td>
                <td class="v">${escape(visit.status)}</td>
              </tr>
            </mj-table>
          </mj-column>
        </mj-section>

        <mj-section padding="0 24px">
          <mj-column>
            <mj-text font-size="12px" font-weight="700" color="#0E6B5C">Services rendered</mj-text>
            <mj-table>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
              ${rows || '<tr><td class="cell" colspan="5"><span class="muted">No billable items on this visit.</span></td></tr>'}
            </mj-table>
          </mj-column>
        </mj-section>

        <mj-section padding="0 24px">
          <mj-column>
            <mj-text align="right" font-weight="700" font-size="14px">
              Total: ${escape(formatCurrency(subtotal))}
            </mj-text>
          </mj-column>
        </mj-section>

        ${documentFooter()}
      </mj-body>
    </mjml>
  `;
}
