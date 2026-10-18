import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { FACILITY_NAME } from 'src/documents/templates/shared';
import { InvoiceDetails } from './invoices.service';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from './enums/payment.enum';
import { ChargeStatus } from './enums/charge.enum';

const MARGIN = 48;
const PAGE_BOTTOM = 760;
const INK = '#111827';
const MUTED = '#6B7280';
const LINE = '#E5E7EB';
const CRITICAL = '#B42318';

const money = (value: number): string => `UGX ${value.toLocaleString('en-US')}`;

const stamp = (value: Date): string =>
  value.toLocaleString('en-GB', {
    timeZone: 'Africa/Kampala',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const label = (value: string): string => value.replaceAll('_', ' ');

function render(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });
}

function heading(
  doc: PDFKit.PDFDocument,
  title: string,
  reference: string,
): void {
  const width = doc.page.width - MARGIN * 2;
  const top = doc.y;
  doc
    .fillColor(INK)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(FACILITY_NAME, MARGIN, top, { width: width / 2 });
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(title, MARGIN + width / 2, top, { width: width / 2, align: 'right' });
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(9)
    .text(reference, MARGIN + width / 2, doc.y, {
      width: width / 2,
      align: 'right',
    });
  doc.moveDown(0.6);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .lineWidth(1)
    .strokeColor(INK)
    .stroke();
  doc.moveDown(0.8);
}

function section(doc: PDFKit.PDFDocument, title: string): void {
  if (doc.y > PAGE_BOTTOM - 60) doc.addPage();
  doc
    .moveDown(0.6)
    .fillColor(MUTED)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(title.toUpperCase(), MARGIN, doc.y, { characterSpacing: 0.8 });
  doc.moveDown(0.3);
}

function field(doc: PDFKit.PDFDocument, name: string, value: string): void {
  const y = doc.y;
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(9)
    .text(name, MARGIN, y + 1, {
      width: 90,
    });
  doc
    .fillColor(INK)
    .font('Helvetica')
    .fontSize(10)
    .text(value, MARGIN + 90, y, { width: doc.page.width - MARGIN * 2 - 90 });
  doc.moveDown(0.2);
}

function rule(doc: PDFKit.PDFDocument): void {
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .lineWidth(0.5)
    .strokeColor(LINE)
    .stroke();
  doc.moveDown(0.5);
}

function row(
  doc: PDFKit.PDFDocument,
  left: string,
  middle: string,
  right: string,
  bold = false,
): void {
  if (doc.y > PAGE_BOTTOM) doc.addPage();
  const y = doc.y;
  const width = doc.page.width - MARGIN * 2;
  doc
    .fillColor(INK)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(10);
  doc.text(left, MARGIN, y, { width: width * 0.55 });
  doc.text(middle, MARGIN + width * 0.55, y, {
    width: width * 0.2,
    align: 'right',
  });
  doc.text(right, MARGIN + width * 0.75, y, {
    width: width * 0.25,
    align: 'right',
  });
  doc.moveDown(0.3);
}

function lines(doc: PDFKit.PDFDocument, details: InvoiceDetails): void {
  details.groups.forEach((group) => {
    if (doc.y > PAGE_BOTTOM - 60) doc.addPage();
    section(doc, group.label);
    group.items.forEach((item) => {
      const waived = item.status === ChargeStatus.WAIVED;
      row(
        doc,
        waived ? `${item.description} (waived)` : item.description,
        `${item.quantity} x ${item.unitPrice.toLocaleString('en-US')}`,
        waived ? '—' : item.amount.toLocaleString('en-US'),
      );
    });
    row(doc, 'Subtotal', '', group.subtotal.toLocaleString('en-US'), true);
  });
}

function totals(doc: PDFKit.PDFDocument, details: InvoiceDetails): void {
  rule(doc);
  row(doc, 'Total', '', money(details.total), true);
  row(doc, 'Paid to date', '', money(details.paid));
  row(doc, 'Balance', '', money(details.balance), true);
}

function voidMark(doc: PDFKit.PDFDocument): void {
  doc.save().rotate(-30, { origin: [300, 400] });
  doc
    .fillColor(CRITICAL)
    .fillOpacity(0.18)
    .font('Helvetica-Bold')
    .fontSize(110)
    .text('VOID', 130, 330);
  doc.restore().fillOpacity(1);
}

function patientBlock(doc: PDFKit.PDFDocument, details: InvoiceDetails): void {
  const { patient, number } = details.invoice;
  field(doc, 'Patient', `${patient.firstName} ${patient.lastName}`);
  field(doc, 'MRN', patient.mrn);
  field(doc, 'Invoice', number);
  rule(doc);
}

@Injectable()
export class ReceiptPdfService {
  invoice(details: InvoiceDetails): Promise<Buffer> {
    return render((doc) => {
      heading(doc, 'Invoice', details.invoice.number);
      field(doc, 'Issued', stamp(details.invoice.createdAt));
      patientBlock(doc, details);
      lines(doc, details);
      totals(doc, details);
      if (details.payments.length > 0) {
        section(doc, 'Payments');
        details.payments.forEach((payment) =>
          row(
            doc,
            `${payment.receiptNumber}  ${label(payment.method)}${payment.status === PaymentStatus.VOIDED ? ' (voided)' : ''}`,
            stamp(payment.receivedAt).slice(0, 11),
            payment.amount.toLocaleString('en-US'),
          ),
        );
      }
    });
  }

  receipt(payment: Payment, details: InvoiceDetails): Promise<Buffer> {
    return render((doc) => {
      heading(doc, 'Payment receipt', payment.receiptNumber);
      field(doc, 'Receipt', payment.receiptNumber);
      field(doc, 'Received', stamp(payment.receivedAt));
      patientBlock(doc, details);
      lines(doc, details);
      totals(doc, details);
      doc.moveDown(0.8);
      field(doc, 'This payment', money(payment.amount));
      field(
        doc,
        'Method',
        payment.reference
          ? `${label(payment.method)} (${payment.reference})`
          : label(payment.method),
      );
      field(doc, 'Received by', payment.receivedBy?.username ?? '—');
      if (payment.status === PaymentStatus.VOIDED) {
        field(doc, 'Voided', `${payment.voidReason ?? ''}`);
        voidMark(doc);
      }
      doc
        .moveDown(1)
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Thank you.', MARGIN);
    });
  }
}
