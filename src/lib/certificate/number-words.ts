const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? '';
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : (TENS[t] ?? '');
}

/** Convert a positive integer to Indian English words (up to crores). */
export function numberToIndianWords(n: number): string {
  const value = Math.floor(Math.abs(n));
  if (value === 0) return 'Zero';

  const parts: string[] = [];

  const crore = Math.floor(value / 10_000_000);
  const lakh = Math.floor((value % 10_000_000) / 100_000);
  const thousand = Math.floor((value % 100_000) / 1000);
  const hundred = Math.floor((value % 1000) / 100);
  const rest = value % 100;

  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) {
    if (parts.length > 0 && rest < 100) parts.push('and');
    parts.push(twoDigits(rest));
  }

  return parts
    .join(' ')
    .replace(/\s+and\s+$/u, '')
    .trim();
}

export function sqYardsInWords(sqYds: number): string {
  const rounded = Math.round(sqYds);
  return `${numberToIndianWords(rounded)} Sq.Yds.`;
}
