import { LOGO_BASE64 } from '../assets/logo';

export const FACILITY_NAME = 'Suubi Medical Centre';
export const VENDOR_NAME = 'Metis Analytica';
export const LOGO_DATA_URI = `data:image/png;base64,${LOGO_BASE64}`;

export function escape(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `UGX ${n.toLocaleString()}`;
}

export function baseDocumentStyles(): string {
  return `
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" color="#111827" />
      <mj-text font-size="12px" line-height="1.5" />
      <mj-table font-size="12px" cellpadding="0" padding="0" />
      <mj-section padding="0 32px" />
    </mj-attributes>
    <mj-style inline="inline">
      .muted { color: #6B7280; font-size: 11px; }
      .label { color: #6B7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
      .heading { color: #111827; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .value { color: #111827; font-weight: 600; }
      .row td { padding: 5px 0; }
      .row td.k { color: #6B7280; width: 18%; }
      .row td.v { color: #111827; font-weight: 500; width: 32%; }
      .abnormal { color: #B42318; font-weight: 700; }
      th { text-align: left; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; padding: 6px 8px 6px 0; border-bottom: 1px solid #111827; }
      td.cell { padding: 7px 8px 7px 0; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
      .code { font-family: 'Menlo', monospace; color: #374151; font-size: 11px; }
      .total td { padding: 4px 0; }
      .total td.grand { font-size: 14px; font-weight: 700; border-top: 1px solid #111827; padding-top: 8px; }
    </mj-style>
    <mj-style>
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    </mj-style>
  `;
}

export function documentHeader(docType: string, reference?: string): string {
  return `
    <mj-section padding="28px 32px 14px">
      <mj-column width="55%" vertical-align="middle">
        <mj-image
          src="${LOGO_DATA_URI}"
          alt="${escape(FACILITY_NAME)}"
          align="left"
          width="110px"
          padding="0"
        />
      </mj-column>
      <mj-column width="45%" vertical-align="middle">
        <mj-text align="right" padding="0" font-size="15px" font-weight="700" letter-spacing="0.02em">
          ${escape(docType)}
        </mj-text>
        <mj-text align="right" padding="2px 0 0" color="#6B7280" font-size="11px">
          ${escape(reference ? `${reference} · ${FACILITY_NAME}` : FACILITY_NAME)}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="0 32px 10px">
      <mj-column>
        <mj-divider border-width="1px" border-color="#111827" padding="0" />
      </mj-column>
    </mj-section>
  `;
}

export function metaGrid(
  pairs: ReadonlyArray<readonly [string, string]>,
): string {
  const rows: string[] = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const cells = pairs
      .slice(i, i + 2)
      .map(
        ([k, v]) =>
          `<td class="k">${escape(k)}</td><td class="v">${escape(v)}</td>`,
      )
      .join('');
    rows.push(`<tr class="row">${cells}</tr>`);
  }
  return `
    <mj-section padding="6px 32px 14px">
      <mj-column>
        <mj-table>${rows.join('')}</mj-table>
      </mj-column>
    </mj-section>
  `;
}

export function sectionTitle(title: string): string {
  return `<mj-text css-class="heading" padding="0 0 6px">${escape(title)}</mj-text>`;
}

export function documentFooter(): string {
  return `
    <mj-section padding="22px 32px 24px">
      <mj-column>
        <mj-divider border-width="1px" border-color="#E5E7EB" padding="0 0 10px" />
        <mj-text align="center" font-size="10px" color="#6B7280" padding="0">
          ${escape(FACILITY_NAME)} · Generated ${escape(formatDate(new Date()))} · Not valid without a provider signature
        </mj-text>
        <mj-text align="center" font-size="9px" color="#9CA3AF" padding="3px 0 0">
          Powered by ${escape(VENDOR_NAME)}
        </mj-text>
        <mj-text align="center" font-size="10px" color="#9CA3AF" css-class="no-print" padding="6px 0 0">
          Ctrl+P to print or save as PDF
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

export function printAutoTriggerScript(): string {
  return `
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 400);
      });
    </script>
  `;
}
