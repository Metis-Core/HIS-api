import type { LabOrderItem } from 'src/lab/entities/lab-order-item.entity';
import type { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabOrderItemStatus } from 'src/lab/enums/lab-order-item-status.enum';
import type { Patient } from 'src/patients/entities/patient.entity';
import { isReleased } from 'src/lab/results/release';
import { renderResultTable } from './lab-result-table';
import { escape, formatDate } from './shared';

/** True when any test still awaits verification, so the copy must say PRELIMINARY. */
export const isPreliminary = (orders: LabOrder[]) =>
  orders.some((order) => reportable(order).some((item) => !isReleased(item)));

export const reportable = (order: LabOrder) =>
  order.items.filter((item) => item.status !== LabOrderItemStatus.CANCELLED);

const statusNote = (item: LabOrderItem, amended: ReadonlySet<string>) => {
  if (!isReleased(item)) {
    return '<span class="abnormal">Not yet verified</span>';
  }
  const by = escape(item.verifiedBy?.username ?? '—');
  const tag = amended.has(item.id) ? ' · <strong>Amended</strong>' : '';
  return `Verified by ${by}<br/><span class="muted">${escape(formatDate(item.verifiedAt))}</span>${tag}`;
};

export function testRows(
  order: LabOrder,
  patient: Patient | null | undefined,
  amended: ReadonlySet<string>,
): string {
  return reportable(order)
    .map(
      (item) => `
        <tr>
          <td class="cell"><span class="code">${escape(item.test?.code ?? '')}</span><br/>${escape(item.test?.name ?? '')}</td>
          <td class="cell">${isReleased(item) ? `${renderResultTable(item, patient)}${item.resultNotes ? `<div class="muted">${escape(item.resultNotes)}</div>` : ''}` : '<span class="muted">Awaiting verification</span>'}</td>
          <td class="cell">${statusNote(item, amended)}</td>
        </tr>`,
    )
    .join('');
}

/** Who released the results: each verifier once, with a line for the wet signature. */
export function signatureBlock(orders: LabOrder[]): string {
  const verifiers = new Map<string, Date | null>();
  orders.flatMap(reportable).forEach((item) => {
    const name = item.verifiedBy?.username;
    if (!isReleased(item) || !name) return;
    const at = item.verifiedAt;
    const seen = verifiers.get(name);
    if (!seen || (at && at > seen)) verifiers.set(name, at);
  });
  const names = [...verifiers.entries()]
    .map(([name, at]) => `${escape(name)} (${escape(formatDate(at))})`)
    .join(', ');
  return `
    <mj-section padding="18px 32px 6px">
      <mj-column>
        <mj-text>Verified by: <strong>${names || 'Pending verification'}</strong></mj-text>
        <mj-text padding-top="18px">Signature: ______________________________ &nbsp; Date: ______________</mj-text>
      </mj-column>
    </mj-section>`;
}
