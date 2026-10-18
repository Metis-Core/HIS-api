import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { groupCharges } from 'src/payments/charge-groups';
import { Invoice } from 'src/payments/entities/invoice.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { VisitCharge } from 'src/payments/entities/visit-charge.entity';
import { ChargeStatus } from 'src/payments/enums/charge.enum';
import { PaymentStatus } from 'src/payments/enums/payment.enum';
import { settle } from 'src/payments/invoice-balance';
import { Visit } from 'src/queue/entities/visit.entity';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatCurrency,
  formatDate,
  metaGrid,
  sectionTitle,
} from './shared';

interface VisitReceiptContext {
  visit: Visit;
  invoice: Invoice | null;
  charges: VisitCharge[];
  payments: Payment[];
  prescriptions: Prescription[];
}

const methodLabel = (method: string) => method.replaceAll('_', ' ');

const chargeRows = (charges: VisitCharge[]) =>
  groupCharges(charges)
    .map(
      (group) => `
        <tr><td class="cell label" colspan="4">${escape(group.label)}</td></tr>
        ${group.items
          .map((c) => {
            const waived = c.status === ChargeStatus.WAIVED;
            return `
          <tr>
            <td class="cell">${escape(c.description)}${waived ? ' <span class="muted">(waived)</span>' : ''}</td>
            <td class="cell">${escape(String(c.quantity))}</td>
            <td class="cell">${escape(formatCurrency(c.unitPrice))}</td>
            <td class="cell">${waived ? '—' : escape(formatCurrency(c.amount))}</td>
          </tr>`;
          })
          .join('')}`,
    )
    .join('');

const paymentRows = (payments: Payment[]) =>
  payments
    .map((p) => {
      const voided = p.status === PaymentStatus.VOIDED;
      return `
        <tr>
          <td class="cell"><span class="code">${escape(p.receiptNumber)}</span></td>
          <td class="cell">${escape(methodLabel(p.method))}${voided ? ' <span class="abnormal">(voided)</span>' : ''}</td>
          <td class="cell">${escape(formatDate(p.receivedAt))}</td>
          <td class="cell">${escape(formatCurrency(p.amount))}</td>
        </tr>`;
    })
    .join('');

const prescribed = (prescriptions: Prescription[]) => {
  const names = prescriptions.flatMap((p) =>
    p.items.map(
      (i) => `${i.item?.name ?? 'Item'} (${i.dosage}, ${i.frequency})`,
    ),
  );
  if (names.length === 0) return '';
  return `
    <mj-section padding="0 32px 14px">
      <mj-column>
        ${sectionTitle('Prescribed')}
        <mj-text padding="0">${names.map(escape).join('<br/>')}</mj-text>
        <mj-text css-class="muted" padding="4px 0 0">Medicines are charged when dispensed at the pharmacy.</mj-text>
      </mj-column>
    </mj-section>`;
};

export function renderVisitReceipt({
  visit,
  invoice,
  charges,
  payments,
  prescriptions,
}: VisitReceiptContext): string {
  const patient = visit.patient;
  const patientName = patient
    ? [patient.firstName, patient.middleName, patient.lastName]
        .filter(Boolean)
        .join(' ')
    : 'Patient';
  const { total, paid, balance } = settle(charges, payments);

  return `
    <mjml>
      <mj-head>
        <mj-title>Visit Receipt</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader('Visit receipt', invoice?.number)}
        ${metaGrid([
          ['Patient', patientName],
          ['MRN', patient?.mrn ?? '—'],
          ['Visit', visit.id.slice(0, 8)],
          ['Type', String(visit.visitType)],
          ['Opened', formatDate(visit.createdAt)],
          ['Status', String(visit.status)],
        ])}

        <mj-section padding="0 32px 14px">
          <mj-column>
            ${sectionTitle('Charges')}
            <mj-table>
              <tr><th style="width:52%">Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr>
              ${chargeRows(charges) || '<tr><td class="cell" colspan="4"><span class="muted">No billable items on this visit.</span></td></tr>'}
            </mj-table>
          </mj-column>
        </mj-section>

        <mj-section padding="0 32px 14px">
          <mj-column width="55%"><mj-text padding="0"> </mj-text></mj-column>
          <mj-column width="45%">
            <mj-table>
              <tr class="total"><td>Total</td><td align="right">${escape(formatCurrency(total))}</td></tr>
              <tr class="total"><td>Paid</td><td align="right">${escape(formatCurrency(paid))}</td></tr>
              <tr class="total"><td class="grand">Balance</td><td class="grand" align="right">${escape(formatCurrency(balance))}</td></tr>
            </mj-table>
          </mj-column>
        </mj-section>

        ${
          payments.length
            ? `<mj-section padding="0 32px 14px"><mj-column>
            ${sectionTitle('Payments')}
            <mj-table>
              <tr><th>Receipt</th><th>Method</th><th>Received</th><th>Amount</th></tr>
              ${paymentRows(payments)}
            </mj-table>
          </mj-column></mj-section>`
            : ''
        }

        ${prescribed(prescriptions)}
        ${documentFooter()}
      </mj-body>
    </mjml>
  `;
}
