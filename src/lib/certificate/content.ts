import { sqYardsInWords } from '@/lib/certificate/number-words';

export interface CertificateContentInput {
  tdrNumber: string;
  tdrCertificateNumber: string;
  holderName: string;
  relation: string;
  village: string;
  mandal: string;
  district: string;
  surveyNumber: string;
  ownershipDeedNo: string | null;
  surrenderedAreaSqYds: number;
  tdrExtentSqYds: number;
  issuedRatio: string;
  issuedAt: string | null;
}

export interface CertificateTableRow {
  serial: number;
  label: string;
  value: string;
}

export interface NarrativePart {
  text: string;
  bold?: boolean;
}

export function formatCertificateDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatCertificateDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function buildCertificateTableRows(data: CertificateContentInput): CertificateTableRow[] {
  const location = `${data.village}, ${data.mandal}, ${data.district}`;
  const extent = `${data.tdrExtentSqYds.toLocaleString('en-IN')} Sq.Yds`;

  return [
    { serial: 1, label: 'Name of Land Owner / Beneficiary', value: data.holderName },
    { serial: 2, label: 'Relation', value: data.relation },
    { serial: 3, label: 'Location of Surrendered Land', value: location },
    { serial: 4, label: 'Survey Number', value: data.surveyNumber },
    {
      serial: 5,
      label: 'Ownership Deed / Document No.',
      value: data.ownershipDeedNo ?? 'As per LPS records',
    },
    {
      serial: 6,
      label: 'Surrendered Land Area',
      value: `${data.surrenderedAreaSqYds.toLocaleString('en-IN')} Sq.Yds`,
    },
    { serial: 7, label: 'Extent of TDR Issued', value: extent },
    { serial: 8, label: 'Authority Issued Ratio', value: data.issuedRatio },
    {
      serial: 9,
      label: 'TDR Bond / Certificate No.',
      value: `${data.tdrCertificateNumber} / ${data.tdrNumber}`,
    },
  ];
}

export function buildNarrativeParts(data: CertificateContentInput): NarrativePart[] {
  const deed = data.ownershipDeedNo ?? 'LPS surrender records';
  return [
    { text: 'M/s. ', bold: false },
    { text: data.holderName, bold: true },
    {
      text: ', has been issued ',
      bold: false,
    },
    { text: `${data.tdrExtentSqYds.toLocaleString('en-IN')} Sq.Yd.`, bold: true },
    {
      text: ' of TDR consequent upon voluntary surrender of land under the Land Pooling Scheme (LPS) for Amaravati Capital Region, Survey No. ',
      bold: false,
    },
    { text: data.surveyNumber, bold: true },
    { text: ', Village ', bold: false },
    { text: data.village, bold: true },
    { text: ', Mandal ', bold: false },
    { text: data.mandal, bold: true },
    { text: ', District ', bold: false },
    { text: data.district, bold: true },
    { text: ' holding document No. ', bold: false },
    { text: deed, bold: true },
    { text: '. Issuance details are as below:', bold: false },
  ];
}

export function buildNarrativePlain(data: CertificateContentInput): string {
  return buildNarrativeParts(data)
    .map((p) => p.text)
    .join('');
}

export function buildPermissoryParts(data: CertificateContentInput): NarrativePart[] {
  const words = sqYardsInWords(data.tdrExtentSqYds);
  const extent = `${data.tdrExtentSqYds.toLocaleString('en-IN')} Sq.Yds.`;

  return [
    { text: data.holderName, bold: true },
    {
      text: ' is hereby permitted to hold and utilize the issued TDR area of ',
      bold: false,
    },
    { text: extent, bold: true },
    { text: ' (In words ', bold: false },
    { text: words, bold: true },
    {
      text: ') proportionately basing on the land value prevailing for the receiving site on the said date as indicated in Annexure - I and subject to terms and conditions given in Annexure - II.',
      bold: false,
    },
  ];
}

export const ANNEXURE_I_TITLE = 'ANNEXURE – I';

export const ANNEXURE_I_FORMULA =
  'B = A × ( Land value of the Original site / Unit Land value of the Receiving site )';

export const ANNEXURE_I_LEGEND = [
  'Where A = TDR granted in Sq.Yds of the area, and',
  'B = The Equivalent Built up area allowable.',
];

export const ANNEXURE_II_TITLE = 'ANNEXURE – II';

export const ANNEXURE_II_HEADING =
  'TERMS AND CONDITIONS OF ISSUE OF THE DEVELOPMENT RIGHT CERTIFICATE';

export const ANNEXURE_II_TERMS: string[] = [
  'The Development Right Certificate (DRC) / TDR shall be valid for utilization within the limits of APCRDA Capital Region Development Area, including notified receiving zones under the Amaravati master plan.',
  'The TDR shall be utilized in receiving areas as per APCRDA building regulations — additional built-up area in non-high-rise zones and proportionate FSI in high-rise zones as notified.',
  'TDR shall not be utilized in ecologically sensitive zones, airport restriction zones, or areas specifically prohibited under statutory master plan notifications.',
  'Utilization of TDR is subject to the Statutory Development Plan, zoning regulations, and building bye-laws in force on the date of utilization.',
  'The beneficiary shall produce the original certificate at APCRDA head office / designated counter for authentication before utilization in a receiving plot.',
  'The certificate shall not be valid where the receiving site has no valid building permission, is under court litigation, or involves unauthorized construction as on the date of application.',
  'A copy of the LPS surrender / entitlement agreement and identity proof shall be produced wherever transfer or utilization is sought.',
  'The certificate shall be deemed extinguished when the balance TDR available becomes zero after utilization entries recorded in the TDR Ledger (Annexure - III).',
];

export const ANNEXURE_III_TITLE = 'ANNEXURE – III';

export const ANNEXURE_III_SUBTITLE = 'TDR LEDGER';

export const LEDGER_COLUMNS = [
  'SNo',
  'Transaction Purpose',
  'Reference No.',
  'Transaction Date',
  'Recipient Name',
  'Utilized Of TDR(Sq.Yd.)',
  'Balance TDR Available(Sq.Yd.)',
] as const;

export function buildLedgerRow(data: CertificateContentInput): {
  serial: number;
  purpose: string;
  reference: string;
  date: string;
  recipient: string;
  utilized: string;
  balance: string;
} {
  return {
    serial: 1,
    purpose: 'ISSUED',
    reference: data.tdrCertificateNumber,
    date: formatCertificateDate(data.issuedAt),
    recipient: data.holderName,
    utilized: '0',
    balance: data.tdrExtentSqYds.toLocaleString('en-IN'),
  };
}

export function toContentInput(data: {
  tdrNumber: string;
  tdrCertificateNumber: string;
  holderName: string;
  relation: string;
  village: string;
  mandal: string;
  district: string;
  surveyNumber: string;
  ownershipDeedNo: string | null;
  surrenderedAreaSqYds: number;
  tdrExtentSqYds: number;
  issuedRatio: string;
  issuedAt: string | null;
}): CertificateContentInput {
  return data;
}
