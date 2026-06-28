import PDFDocument from 'pdfkit';
import type { CertificateData } from '@/types/certificate';

export async function generateCertificatePdf(
  data: CertificateData,
  qrBuffer: Buffer,
  lang: 'en' | 'te' = 'en',
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const title =
      lang === 'te'
        ? 'TRANSFERABLE DEVELOPMENT RIGHTS CERTIFICATE'
        : 'TRANSFERABLE DEVELOPMENT RIGHTS CERTIFICATE';

    doc.fontSize(10).text('Government of Andhra Pradesh', { align: 'center' });
    doc
      .fontSize(14)
      .text('Andhra Pradesh Capital Region Development Authority', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.font('Helvetica').fontSize(9).text('G.O. 207 MA&UD dt. 08.08.2016 · LPS Rule 5(4)(B)', {
      align: 'center',
    });
    doc.moveDown(2);

    doc.fontSize(11);
    doc.text(`TDR Number: ${data.tdrNumber}`);
    doc.text(`Holder: ${data.holderName}`);
    doc.text(`Aadhaar: XXXX-XXXX-${data.aadhaarLast4}`);
    doc.text(`Relation: ${data.relationType} ${data.relationName}`);
    doc.moveDown();

    doc.text(`Survey Number: ${data.surveyNumber}`);
    doc.text(`Village: ${data.village}`);
    doc.text(`Surrendered Area: ${data.surrenderedAreaSqYds} Sq Yards`);
    doc.text(`TDR Issued Extent: ${data.tdrExtentSqYds} Sq Yards`);
    doc.text(`Issued Ratio: ${data.issuedRatio}`);
    doc.moveDown(2);

    doc.text(`Digitally signed by: ${data.commissionerName}, Commissioner APCRDA`);
    doc.text(`Transaction Hash: ${data.fabricTxId ?? 'N/A'}`);
    doc.moveDown();

    if (qrBuffer.length > 0) {
      doc.image(qrBuffer, doc.page.width - 150, doc.page.height - 150, { width: 80 });
    }

    doc
      .fontSize(8)
      .text(`Verify at: tdr.apcrda.ap.gov.in/verify/${data.tdrNumber}`, 50, doc.page.height - 50, {
        align: 'center',
      });

    doc.end();
  });
}
