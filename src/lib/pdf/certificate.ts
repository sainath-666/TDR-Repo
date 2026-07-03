import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { CertificateData } from '@/types/certificate';
import {
  ANNEXURE_I_FORMULA,
  ANNEXURE_I_LEGEND,
  ANNEXURE_I_TITLE,
  ANNEXURE_II_HEADING,
  ANNEXURE_II_TERMS,
  ANNEXURE_II_TITLE,
  ANNEXURE_III_SUBTITLE,
  ANNEXURE_III_TITLE,
  buildCertificateTableRows,
  buildLedgerRow,
  buildNarrativeParts,
  buildPermissoryParts,
  formatCertificateDate,
  formatCertificateDateTime,
  toContentInput,
  LEDGER_COLUMNS,
} from '@/lib/certificate/content';
import {
  contentLeft,
  contentWidth,
  drawCertificateHeader,
  drawDataTable,
  drawFileMetaRow,
  drawLedgerSummary,
  drawLedgerTable,
  drawNarrativeParagraph,
  drawPageNumber,
  drawSignatureBlocks,
  drawWrappedTerms,
  drawCertificateBorder,
  drawWatermark,
  INNER_PAD,
  PAGE_MARGIN,
} from '@/lib/pdf/certificate-layout';

function logoPath(): string | null {
  const p = path.join(process.cwd(), 'public', 'images', 'APCRDA.png');
  return fs.existsSync(p) ? p : null;
}

function renderPageShell(doc: PDFKit.PDFDocument): void {
  drawCertificateBorder(doc);
  drawWatermark(doc);
}

export async function generateCertificatePdf(
  data: CertificateData,
  qrBuffer: Buffer,
  _lang: 'en' | 'te' = 'en',
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const content = toContentInput({
      tdrNumber: data.tdrNumber,
      tdrCertificateNumber: data.tdrCertificateNumber,
      holderName: data.holderName,
      relation: `${data.relationType} ${data.relationName}`,
      village: data.village,
      mandal: data.mandal,
      district: data.district,
      surveyNumber: data.surveyNumber,
      ownershipDeedNo: data.ownershipDeedNo ?? null,
      surrenderedAreaSqYds: data.surrenderedAreaSqYds,
      tdrExtentSqYds: data.tdrExtentSqYds,
      issuedRatio: data.issuedRatio,
      issuedAt: data.issuedAt,
    });

    const fileDate = formatCertificateDate(data.issuedAt);
    const logo = logoPath();

    // —— Page 1: Main certificate ——
    renderPageShell(doc);

    let y = drawCertificateHeader(
      doc,
      'DEVELOPMENT RIGHT CERTIFICATE',
      'G.O.Ms.No. 207 MA&UD dt. 08.08.2016 · LPS Rule 5(4)(B)',
      qrBuffer,
      logo,
    );

    y = drawFileMetaRow(doc, y, data.tdrCertificateNumber, fileDate);
    y = drawNarrativeParagraph(doc, y, buildNarrativeParts(content));
    y = drawDataTable(doc, y, buildCertificateTableRows(content));
    y = drawNarrativeParagraph(doc, y, buildPermissoryParts(content));

    if (data.blockchainPending) {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#64748b')
        .text(
          'Note: Blockchain ledger anchoring pending (offline TDR migration track).',
          contentLeft(doc),
          y,
          { width: contentWidth(doc) },
        );
      y = doc.y + 8;
    }

    drawSignatureBlocks(doc, PAGE_MARGIN + doc.page.height - PAGE_MARGIN * 2 - 95);
    drawPageNumber(doc, 1);

    // —— Page 2: Annexure I & II ——
    doc.addPage();
    renderPageShell(doc);

    const left = contentLeft(doc);
    const width = contentWidth(doc);
    y = PAGE_MARGIN + INNER_PAD + 20;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
    doc.text(ANNEXURE_I_TITLE, left, y, { width, align: 'center' });
    y = doc.y + 14;
    doc.font('Helvetica').fontSize(9).text(ANNEXURE_I_FORMULA, left, y, { width, align: 'center' });
    y = doc.y + 10;
    ANNEXURE_I_LEGEND.forEach((line) => {
      doc.fontSize(8).text(line, left, y, { width, align: 'center' });
      y = doc.y + 4;
    });

    y += 24;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(ANNEXURE_II_TITLE, left, y, { width, align: 'center' });
    y = doc.y + 10;
    doc.fontSize(9).text(ANNEXURE_II_HEADING, left, y, { width, align: 'center' });
    y = doc.y + 14;
    drawWrappedTerms(doc, y, ANNEXURE_II_TERMS);
    drawPageNumber(doc, 2);

    // —— Page 3: Annexure III Ledger ——
    doc.addPage();
    renderPageShell(doc);

    y = PAGE_MARGIN + INNER_PAD + 20;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
    doc.text(ANNEXURE_III_TITLE, left, y, { width, align: 'center' });
    y = doc.y + 6;
    doc.text(ANNEXURE_III_SUBTITLE, left, y, { width, align: 'center' });
    y = doc.y + 16;

    const ledger = buildLedgerRow(content);
    y = drawLedgerSummary(doc, y, [
      { label: 'Holder Name', value: data.holderName },
      { label: 'Certificate No', value: data.tdrCertificateNumber },
      { label: 'Issue Date', value: ledger.date },
      { label: 'As on Date', value: formatCertificateDateTime(data.issuedAt) },
      { label: 'Balance', value: ledger.balance },
      { label: 'TDR Bond', value: data.tdrNumber },
    ]);

    drawLedgerTable(doc, y, LEDGER_COLUMNS, ledger);

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#333333')
      .text(data.tdrCertificateNumber, left, doc.page.height - PAGE_MARGIN - INNER_PAD - 30);

    drawPageNumber(doc, 3);

    doc.end();
  });
}
