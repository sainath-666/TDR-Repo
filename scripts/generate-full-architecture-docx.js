const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const JSZip = require('jszip');
const { Document, Packer, Paragraph, ImageRun, AlignmentType, PageBreak } = require('docx');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(DOCS, 'APCRDA-TDR-Portal-Architecture-And-Workflows.docx');
const TMP = path.join(DOCS, '_build-images');
const EXPORT_PS1 = path.join(__dirname, 'export-pptx-slides.ps1');

const SPEC_DOCX = path.join(DOCS, 'APCRDA-TDR-Portal-System-Specification.docx');
const WORKFLOW_PPTX = path.join(DOCS, 'APCRDA-TDR-Portal-Workflow.pptx');
const LOGIN_PPTX = path.join(DOCS, 'APCRDA-TDR-Portal-Login-Workflows.pptx');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function extractSpecImages() {
  const outDir = path.join(TMP, 'spec');
  ensureDir(outDir);

  const zipData = fs.readFileSync(SPEC_DOCX);
  const zip = await JSZip.loadAsync(zipData);
  const relsXml = await zip.file('word/_rels/document.xml.rels').async('string');
  const docXml = await zip.file('word/document.xml').async('string');

  const relMap = {};
  for (const match of relsXml.matchAll(/Id="(rId\d+)"[^>]+Target="media\/([^"]+)"/g)) {
    relMap[match[1]] = match[2];
  }

  const imageOrder = [];
  for (const match of docXml.matchAll(/r:embed="(rId\d+)"/g)) {
    if (!imageOrder.includes(match[1])) imageOrder.push(match[1]);
  }

  const paths = [];
  let idx = 0;
  for (const rid of imageOrder) {
    const mediaFile = relMap[rid];
    if (!mediaFile) continue;
    const entry = zip.file(`word/media/${mediaFile}`);
    if (!entry) continue;
    idx += 1;
    const out = path.join(outDir, `spec-${idx}.png`);
    const buf = await entry.async('nodebuffer');
    fs.writeFileSync(out, buf);
    paths.push(out);
  }

  return paths;
}

function exportPptxSlides(pptxPath, prefix) {
  const outDir = path.join(TMP, prefix);
  ensureDir(outDir);

  const result = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', EXPORT_PS1, pptxPath, outDir, prefix],
    { encoding: 'utf8', timeout: 300000 },
  ).trim();

  return result ? result.split('|').filter(Boolean) : [];
}

function imageSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return { width: 1920, height: 1080 };
}

function fitWidth(size, maxWidth = 580) {
  const scale = maxWidth / size.width;
  return { width: maxWidth, height: Math.round(size.height * scale) };
}

function imageParagraph(filePath) {
  const data = fs.readFileSync(filePath);
  const size = fitWidth(imageSize(filePath));
  return new Paragraph({
    children: [new ImageRun({ data, transformation: size })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

async function main() {
  ensureDir(TMP);

  console.log('Extracting architecture / infrastructure / ERD images...');
  const specImages = await extractSpecImages();
  console.log(`  ${specImages.length} images from system specification`);

  console.log('Exporting workflow presentation slides...');
  const workflowSlides = exportPptxSlides(WORKFLOW_PPTX, 'workflow');
  console.log(`  ${workflowSlides.length} workflow slides`);

  console.log('Exporting login workflow presentation slides...');
  const loginSlides = exportPptxSlides(LOGIN_PPTX, 'login');
  console.log(`  ${loginSlides.length} login workflow slides`);

  const allImages = [...specImages, ...workflowSlides, ...loginSlides];
  if (!allImages.length) throw new Error('No images collected for document generation.');

  console.log('Building DOCX (images only)...');
  const children = [];
  allImages.forEach((img, index) => {
    children.push(imageParagraph(img));
    if (index < allImages.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const buffer = await Packer.toBuffer(new Document({ sections: [{ properties: {}, children }] }));
  fs.writeFileSync(OUT, buffer);
  console.log(`\nDone: ${OUT}`);
  console.log(`Total pages: ${allImages.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
