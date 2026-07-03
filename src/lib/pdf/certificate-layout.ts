import fs from 'fs';
import path from 'path';
import type { CertificateTableRow } from '@/lib/certificate/content';
import type PDFDocument from 'pdfkit';

export const CERT_GREEN = '#1B5E20';
export const CERT_GREEN_LIGHT = '#2E7D32';
export const PAGE_MARGIN = 28;
export const INNER_PAD = 14;

const APGOV_WATERMARK_PATH = path.join(process.cwd(), 'public', 'images', 'APGOV.png');

export function contentWidth(doc: PDFDocument): number {
  return doc.page.width - PAGE_MARGIN * 2 - INNER_PAD * 2;
}

export function contentLeft(doc: PDFDocument): number {
  return PAGE_MARGIN + INNER_PAD;
}

export function drawCertificateBorder(doc: PDFDocument): void {
  const { width, height } = doc.page;
  const outer = PAGE_MARGIN;
  const w = width - outer * 2;
  const h = height - outer * 2;

  doc.save();
  doc.lineWidth(2.5).strokeColor(CERT_GREEN);
  doc.rect(outer, outer, w, h).stroke();
  doc.lineWidth(1.2).strokeColor(CERT_GREEN_LIGHT);
  doc.rect(outer + 5, outer + 5, w - 10, h - 10).stroke();
  doc.lineWidth(0.8).dash(4, { space: 3 }).strokeColor(CERT_GREEN);
  doc.rect(outer + 10, outer + 10, w - 20, h - 20).stroke();
  doc.undash();
  doc.restore();
}

export function drawWatermark(doc: PDFDocument): void {
  const cx = doc.page.width / 2;
  const cy = doc.page.height / 2;

  if (fs.existsSync(APGOV_WATERMARK_PATH)) {
    const size = 240;
    doc.save();
    doc.opacity(0.1);
    doc.image(APGOV_WATERMARK_PATH, cx - size / 2, cy - size / 2, {
      fit: [size, size],
      align: 'center',
      valign: 'center',
    });
    doc.restore();
    return;
  }

  doc.save();
  doc.opacity(0.05);
  doc.lineWidth(1).strokeColor(CERT_GREEN);
  doc.circle(cx, cy, 130).stroke();
  doc.restore();
}

export function drawPageNumber(doc: PDFDocument, page: number): void {
  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  doc.text(String(page), 0, doc.page.height - PAGE_MARGIN + 6, {
    width: doc.page.width,
    align: 'center',
  });
}

export function drawCertificateHeader(
  doc: PDFDocument,
  title: string,
  subtitle: string,
  qrBuffer: Buffer,
  logoPath: string | null,
): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);
  let y = PAGE_MARGIN + INNER_PAD + 4;

  if (logoPath) {
    try {
      doc.image(logoPath, left, y, { width: 42 });
    } catch {
      // logo optional
    }
  }

  if (qrBuffer.length > 0) {
    doc.image(qrBuffer, left + width - 62, y - 2, { width: 58 });
  }

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#000000');
  doc.text('ANDHRA PRADESH CAPITAL REGION', left, y + 2, { width: width - 70, align: 'center' });
  y = doc.y + 2;
  doc.fontSize(12).text('DEVELOPMENT AUTHORITY', left, y, { width: width - 70, align: 'center' });
  y = doc.y + 6;
  doc.fontSize(11).text(title, left, y, { width: width - 70, align: 'center' });
  y = doc.y + 4;
  doc
    .font('Helvetica')
    .fontSize(8)
    .text(subtitle, left, y, { width: width - 70, align: 'center' });

  return doc.y + 10;
}

export function drawFileMetaRow(
  doc: PDFDocument,
  y: number,
  fileNo: string,
  fileDate: string,
): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);

  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  doc.text(`File No.: `, left, y, { continued: true });
  doc.font('Helvetica-Bold').text(fileNo, { continued: false });

  const dateLabel = `File Date: ${fileDate}`;
  doc.font('Helvetica').text(dateLabel, left, y, { width, align: 'right' });

  return y + 16;
}

export function drawNarrativeParagraph(
  doc: PDFDocument,
  y: number,
  parts: { text: string; bold?: boolean }[],
): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);

  doc.x = left;
  doc.y = y;
  doc.fontSize(9).fillColor('#000000');

  parts.forEach((part, index) => {
    doc.font(part.bold ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(part.text, {
      width,
      continued: index < parts.length - 1,
      align: 'justify',
      lineGap: 1,
    });
  });

  return doc.y + 8;
}

export function drawDataTable(doc: PDFDocument, y: number, rows: CertificateTableRow[]): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);
  const colSerial = 28;
  const colLabel = 200;
  const colValue = width - colSerial - colLabel;
  const rowHeight = 22;

  rows.forEach((row, index) => {
    const ry = y + index * rowHeight;
    doc.lineWidth(0.6).strokeColor('#000000');
    doc.rect(left, ry, colSerial, rowHeight).stroke();
    doc.rect(left + colSerial, ry, colLabel, rowHeight).stroke();
    doc.rect(left + colSerial + colLabel, ry, colValue, rowHeight).stroke();

    doc.font('Helvetica').fontSize(8).fillColor('#000000');
    doc.text(String(row.serial), left + 2, ry + 7, {
      width: colSerial - 4,
      align: 'center',
    });
    doc.text(row.label, left + colSerial + 4, ry + 7, { width: colLabel - 8 });
    doc.font('Helvetica-Bold').text(row.value, left + colSerial + colLabel + 4, ry + 7, {
      width: colValue - 8,
    });
  });

  return y + rows.length * rowHeight + 10;
}

export function drawSignatureBlocks(doc: PDFDocument, y: number): void {
  const left = contentLeft(doc);
  const width = contentWidth(doc);
  const blockW = (width - 24) / 2;

  const blocks = [
    {
      title: 'DIRECTOR (LANDS)',
      org: 'APCRDA',
      footer: 'Seal & Stamp',
    },
    {
      title: 'COMMISSIONER',
      org: 'APCRDA',
      footer: 'Seal & Stamp',
    },
  ];

  blocks.forEach((block, i) => {
    const bx = left + i * (blockW + 24);
    doc.save();
    doc.lineWidth(0.5).strokeColor(CERT_GREEN).fillColor(CERT_GREEN);
    doc
      .moveTo(bx + 8, y + 18)
      .lineTo(bx + 14, y + 26)
      .lineTo(bx + 26, y + 10)
      .stroke();
    doc.restore();

    doc.font('Helvetica').fontSize(7).fillColor('#333333');
    doc.text('Digitally signed by', bx, y);
    doc.text(block.title, bx, y + 10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, bx, y + 20);

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
    doc.text(block.title, bx, y + 44, { width: blockW, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(block.org, bx, y + 56, { width: blockW, align: 'center' });
    doc.fontSize(7).text(block.footer, bx, y + 68, { width: blockW, align: 'center' });
  });
}

export function drawWrappedTerms(
  doc: PDFDocument,
  y: number,
  terms: string[],
  fontSize = 7.5,
): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);
  let cy = y;

  terms.forEach((term, index) => {
    doc.font('Helvetica').fontSize(fontSize).fillColor('#000000');
    const text = `${index + 1}. ${term}`;
    doc.text(text, left, cy, { width, align: 'justify', lineGap: 1 });
    cy = doc.y + 4;
  });

  return cy;
}

export function drawLedgerSummary(
  doc: PDFDocument,
  y: number,
  fields: { label: string; value: string }[],
): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);
  const colW = width / 2;
  let cy = y;

  for (let i = 0; i < fields.length; i += 2) {
    const leftField = fields[i];
    const rightField = fields[i + 1];
    doc.font('Helvetica').fontSize(8).fillColor('#000000');
    if (leftField) {
      doc.text(`${leftField.label}: `, left, cy, { continued: true });
      doc.font('Helvetica-Bold').text(leftField.value);
    }
    if (rightField) {
      doc.font('Helvetica').text(`${rightField.label}: `, left + colW, cy, { continued: true });
      doc.font('Helvetica-Bold').text(rightField.value);
    }
    cy += 14;
  }

  return cy + 6;
}

export function drawLedgerTable(
  doc: PDFDocument,
  y: number,
  columns: readonly string[],
  row: {
    serial: number;
    purpose: string;
    reference: string;
    date: string;
    recipient: string;
    utilized: string;
    balance: string;
  },
): number {
  const left = contentLeft(doc);
  const width = contentWidth(doc);
  const colWidths = [22, 58, 72, 52, 78, 62, 62];
  const headerH = 24;
  const rowH = 22;

  let x = left;
  columns.forEach((col, i) => {
    const w = colWidths[i] ?? 50;
    doc.lineWidth(0.6).strokeColor('#000000');
    doc.rect(x, y, w, headerH).stroke();
    doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#000000');
    doc.text(col, x + 1, y + 4, { width: w - 2, align: 'center' });
    x += w;
  });

  const values = [
    String(row.serial),
    row.purpose,
    row.reference,
    row.date,
    row.recipient,
    row.utilized,
    row.balance,
  ];

  x = left;
  const ry = y + headerH;
  values.forEach((val, i) => {
    const w = colWidths[i] ?? 50;
    doc.rect(x, ry, w, rowH).stroke();
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .text(val, x + 2, ry + 7, { width: w - 4 });
    x += w;
  });

  return ry + rowH + 8;
}
