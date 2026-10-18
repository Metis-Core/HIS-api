import { effectiveSchema } from 'src/lab/results/effective-schema';
import { LabResultFlag } from 'src/lab/results/result-schema.types';
import { OrderKind } from 'src/orders/enums/order-kind.enum';
import { ResultClassification } from 'src/orders/enums/result-classification.enum';
import type { ProcedureOrder } from 'src/orders/entities/procedure-order.entity';
import {
  baseDocumentStyles,
  documentFooter,
  documentHeader,
  escape,
  formatDate,
  metaGrid,
  sectionTitle,
} from './shared';

const display = (value: unknown) =>
  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

const CLASSIFICATION_LABEL: Record<ResultClassification, string> = {
  [ResultClassification.NORMAL]: 'Normal',
  [ResultClassification.ABNORMAL]: 'Abnormal',
  [ResultClassification.CRITICAL]: 'Critical',
};

const fullName = (p: ProcedureOrder['patient']) =>
  [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');

const findingRows = (order: ProcedureOrder) => {
  const data = order.resultData ?? {};
  const grouped = new Map<string, string[]>();
  effectiveSchema(order.test)
    .fields.filter((field) => field.key in data)
    .forEach((field) => {
      const flagged = order.resultFlags?.[field.key];
      const value = `${escape(display(data[field.key]))}${field.unit ? ` ${escape(field.unit)}` : ''}`;
      const row = `<tr>
        <td class="cell">${escape(field.label)}</td>
        <td class="cell value${flagged && flagged !== LabResultFlag.ABNORMAL ? ' abnormal' : ''}">${value}</td>
        <td class="cell abnormal">${flagged ? '●' : ''}</td>
      </tr>`;
      const group = field.group ?? '';
      grouped.set(group, [...(grouped.get(group) ?? []), row]);
    });
  return [...grouped.entries()]
    .map(
      ([group, rows]) =>
        `${group ? `<tr><td class="cell label" colspan="3">${escape(group)}</td></tr>` : ''}${rows.join('')}`,
    )
    .join('');
};

export function renderProcedureReport(order: ProcedureOrder): string {
  const isImaging = order.kind === OrderKind.RADIOLOGY;
  const title = isImaging ? 'Imaging report' : 'Procedure report';
  const classification = order.classification
    ? CLASSIFICATION_LABEL[order.classification]
    : '—';
  return `
    <mjml>
      <mj-head>
        <mj-title>${escape(title)}</mj-title>
        ${baseDocumentStyles()}
      </mj-head>
      <mj-body background-color="#FFFFFF">
        ${documentHeader(title, order.id.slice(0, 8).toUpperCase())}
        ${metaGrid([
          ['Patient', fullName(order.patient)],
          ['MRN', order.patient.mrn ?? '—'],
          ['Examination', order.test?.name ?? order.name],
          ['Requested by', order.orderedBy?.username ?? '—'],
          ['Requested', formatDate(order.createdAt)],
          ['Completed', formatDate(order.completedAt)],
          ['Performed by', order.performedBy?.username ?? '—'],
          ['Classification', classification],
        ])}
        ${
          order.indication
            ? `<mj-section padding="0 32px 12px"><mj-column>${sectionTitle('Clinical indication')}<mj-text padding="0">${escape(order.indication)}</mj-text></mj-column></mj-section>`
            : ''
        }
        <mj-section padding="0 32px 12px">
          <mj-column>
            ${sectionTitle('Findings')}
            <mj-table>
              <tr><th style="width:50%">Parameter</th><th>Result</th><th style="width:8%">Flag</th></tr>
              ${findingRows(order) || '<tr><td class="cell" colspan="3"><span class="muted">No structured findings recorded.</span></td></tr>'}
            </mj-table>
          </mj-column>
        </mj-section>
        ${
          order.impression
            ? `<mj-section padding="0 32px 12px"><mj-column>${sectionTitle('Impression')}<mj-text padding="0" font-size="13px" font-weight="600">${escape(order.impression)}</mj-text></mj-column></mj-section>`
            : ''
        }
        ${
          order.report
            ? `<mj-section padding="0 32px 12px"><mj-column>${sectionTitle('Notes')}<mj-text padding="0">${escape(order.report)}</mj-text></mj-column></mj-section>`
            : ''
        }
        <mj-section padding="18px 32px 6px">
          <mj-column>
            <mj-text>Signature: ______________________________ &nbsp; Date: ______________</mj-text>
          </mj-column>
        </mj-section>
        ${documentFooter()}
      </mj-body>
    </mjml>`;
}
