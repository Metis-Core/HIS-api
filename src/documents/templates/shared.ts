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
      <mj-text font-size="13px" line-height="1.5" />
      <mj-section padding="0 28px" />
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
      .doc-badge {
        display: inline-block;
        padding: 5px 14px;
        border-radius: 999px;
        background-color: rgba(255,255,255,0.16);
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
    </mj-style>
    <mj-style>
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    </mj-style>
  `;
}

export function documentHeader(docType: string): string {
  return `
    <mj-section background-color="#0E6B5C" padding="20px 28px" border-radius="0">
      <mj-column width="60%" vertical-align="middle">
        <mj-image
          src="${LOGO_DATA_URI}"
          alt="${escape(FACILITY_NAME)}"
          align="left"
          width="130px"
          padding="0"
        />
      </mj-column>
      <mj-column width="40%" vertical-align="middle">
        <mj-text align="right" padding="0 0 4px 0">
          <span class="doc-badge">${escape(docType)}</span>
        </mj-text>
        <mj-text align="right" color="#E8F3F0" font-size="10px" padding="0">
          ${escape(FACILITY_NAME)}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

export function documentFooter(): string {
  return `
    <mj-section padding="16px 28px" background-color="#F7F9F8" border-top="1px solid #E3E8E6">
      <mj-column>
        <mj-text align="center" font-size="10px" color="#5B6572">
          ${escape(FACILITY_NAME)} · Generated ${escape(formatDate(new Date()))} · Not valid without a provider signature
        </mj-text>
        <mj-text align="center" font-size="9px" color="#9AA3AC" padding="4px 0 0 0">
          Powered by ${escape(VENDOR_NAME)}
        </mj-text>
        <mj-text align="center" font-size="10px" color="#5B6572" css-class="no-print" padding="8px 0 0 0">
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
