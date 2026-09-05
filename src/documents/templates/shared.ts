export const APP_NAME = 'Metis Healthcare';

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
      <mj-text font-size="13px" line-height="1.5" />
      <mj-section padding="0 24px" />
    </mj-attributes>
    <mj-style inline="inline">
      .muted { color: #5B6572; font-size: 11px; }
      .label { color: #5B6572; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      .value { color: #111827; font-weight: 600; }
      .row td { padding: 6px 0; border-bottom: 1px solid #E3E8E6; }
      .row td.k { color: #5B6572; width: 40%; }
      .row td.v { color: #111827; font-weight: 500; }
      .abnormal { color: #D0342C; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; color: #5B6572; text-transform: uppercase; font-size: 10px; padding: 6px 8px; border-bottom: 1px solid #E3E8E6; }
      td.cell { padding: 6px 8px; border-bottom: 1px solid #E3E8E6; }
      .code { font-family: 'Menlo', monospace; color: #0E6B5C; font-weight: 600; }
    </mj-style>
    <mj-style>
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    </mj-style>
  `;
}

export function documentHeader(subtitle: string): string {
  return `
    <mj-section background-color="#0E6B5C" padding="18px 24px">
      <mj-column>
        <mj-text color="#FFFFFF" font-size="18px" font-weight="700">${APP_NAME}</mj-text>
        <mj-text color="#FFFFFF" font-size="11px">${escape(subtitle)}</mj-text>
      </mj-column>
    </mj-section>
  `;
}

export function documentFooter(): string {
  return `
    <mj-section padding="12px 24px" background-color="#F7F9F8">
      <mj-column>
        <mj-text align="center" font-size="10px" color="#5B6572">
          Generated ${escape(formatDate(new Date()))} by ${APP_NAME} · Not valid without a provider signature
        </mj-text>
        <mj-text align="center" font-size="10px" color="#5B6572" css-class="no-print">
          Use Ctrl+P (⌘+P on Mac) → Save as PDF
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
