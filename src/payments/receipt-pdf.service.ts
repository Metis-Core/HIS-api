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
const MUTED = '#5B6572';
const LINE = '#E3E8E6';
const BRAND = '#0E6B5C';
const CRITICAL = '#D0342C';

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

function heading(doc: PDFKit.PDFDocument, title: string): void {
  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(18).text(FACILITY_NAME);
  doc.fillColor(MUTED).font('Helvetica').fontSize(11).text(title);
  doc.moveDown(0.8);
}

function field(doc: PDFKit.PDFDocument, name: string, value: string): void {
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(9)
    .text(name.toUpperCase(), { continued: true });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(`   ${value}`);
}

function rule(doc: PDFKit.PDFDocument): void {
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
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
    doc
      .moveDown(0.4)
      .fillColor(BRAND)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(group.label, MARGIN);
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
      heading(doc, 'Invoice');
      field(doc, 'Issued', stamp(details.invoice.createdAt));
      patientBlock(doc, details);
      lines(doc, details);
      totals(doc, details);
      if (details.payments.length > 0) {
        doc
          .moveDown(0.6)
          .fillColor(BRAND)
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Payments', MARGIN);
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
      heading(doc, 'Payment receipt');
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
