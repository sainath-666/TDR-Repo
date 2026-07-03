import Image from 'next/image';
import Link from 'next/link';
import { CertificateQr } from '@/components/farmer/CertificateQr';
import type { CertificatePreviewData } from '@/lib/certificate/preview-data';
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
  type NarrativePart,
} from '@/lib/certificate/content';
import { cn } from '@/lib/utils';

interface TdrCertificatePreviewProps {
  data: CertificatePreviewData;
  compact?: boolean;
  className?: string;
}

function NarrativeText({ parts, className }: { parts: NarrativePart[]; className?: string }) {
  return (
    <p className={className}>
      {parts.map((part, i) => (
        <span key={i} className={part.bold ? 'font-bold text-slate-900' : undefined}>
          {part.text}
        </span>
      ))}
    </p>
  );
}

function CertWatermark({ compact }: { compact?: boolean }) {
  const size = compact ? 200 : 280;

  return (
    <div className="tdr-cert-watermark" aria-hidden>
      <Image
        src="/images/APGOV.png"
        alt=""
        width={size}
        height={size}
        className="tdr-cert-watermark-img"
        priority={false}
      />
    </div>
  );
}

function CertPageShell({
  page,
  compact,
  children,
}: {
  page: number;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={cn('tdr-cert-sheet', compact && 'tdr-cert-sheet--compact')}>
      <div
        className={cn(
          'tdr-cert-frame',
          compact ? 'tdr-cert-frame--compact' : 'tdr-cert-frame--full',
        )}
      >
        <div className={cn('tdr-cert-inner', compact && 'tdr-cert-inner--compact')}>
          <CertWatermark compact={compact} />
          <div className="relative z-[1] flex min-h-[inherit] flex-1 flex-col">{children}</div>
          <span className="tdr-cert-page-no">{page}</span>
        </div>
      </div>
    </article>
  );
}

function CertHeader({ data, compact }: { data: CertificatePreviewData; compact?: boolean }) {
  const qrSize = compact ? 56 : 72;

  return (
    <header className="tdr-cert-header">
      <div className="tdr-cert-header-qr">
        <CertificateQr verifyPath={data.verifyPath} size={qrSize} />
        <Link
          href={data.verifyPath}
          className={cn(
            'mt-1 font-sans text-[9px] font-semibold text-[#1b5e20] hover:underline',
            compact && 'text-[8px]',
          )}
        >
          Verify
        </Link>
      </div>

      <div className={cn('tdr-cert-emblem', compact && 'tdr-cert-emblem--compact')}>
        <Image
          src="/images/APCRDA.png"
          alt="APCRDA emblem"
          width={compact ? 32 : 48}
          height={compact ? 32 : 48}
          className="object-contain"
        />
      </div>

      <p className={cn('tdr-cert-org', compact && 'tdr-cert-org--compact')}>
        Andhra Pradesh Capital Region
        <br />
        Development Authority
      </p>
      <h2 className={cn('tdr-cert-title', compact && 'tdr-cert-title--compact')}>
        Development Right Certificate
      </h2>
      <p className={cn('tdr-cert-subtitle', compact && 'text-[8px]')}>
        G.O.Ms.No. 207 MA&amp;UD dt. 08.08.2016 · LPS Rule 5(4)(B)
      </p>
    </header>
  );
}

function SignatureBlocks() {
  const roles = [
    { title: 'Director (Lands)', org: 'APCRDA' },
    { title: 'Commissioner', org: 'APCRDA' },
  ];

  return (
    <div className="tdr-cert-signatures">
      {roles.map((role) => (
        <div key={role.title} className="tdr-cert-signature">
          <div className="tdr-cert-sig-check" aria-hidden>
            ✓
          </div>
          <p className="mb-1 text-left font-sans text-[9px] text-slate-500">Digitally signed by</p>
          <p className="tdr-cert-sig-role">{role.title}</p>
          <p className="tdr-cert-sig-org">{role.org}</p>
          <p className="tdr-cert-sig-stamp">Seal &amp; Stamp</p>
        </div>
      ))}
    </div>
  );
}

function CertificatePageOne({
  data,
  compact,
}: {
  data: CertificatePreviewData;
  compact?: boolean;
}) {
  const content = toContentInput({
    tdrNumber: data.tdrNumber,
    tdrCertificateNumber: data.tdrCertificateNumber,
    holderName: data.holderName,
    relation: data.relation,
    village: data.village,
    mandal: data.mandal,
    district: data.district,
    surveyNumber: data.surveyNumber,
    ownershipDeedNo: data.ownershipDeedNo,
    surrenderedAreaSqYds: data.surrenderedAreaSqYds,
    tdrExtentSqYds: data.tdrExtentSqYds,
    issuedRatio: data.issuedRatio,
    issuedAt: data.issuedAt,
  });

  const fileDate = formatCertificateDate(data.issuedAt);
  const bodyClass = cn('tdr-cert-body mb-4', compact && 'tdr-cert-body--compact');

  return (
    <CertPageShell page={1} compact={compact}>
      <CertHeader data={data} compact={compact} />

      <div className={cn('tdr-cert-meta', compact && 'text-[9px]')}>
        <p>
          File No.: <strong>{data.tdrCertificateNumber}</strong>
        </p>
        <p>
          File Date: <strong>{fileDate}</strong>
        </p>
      </div>

      <NarrativeText parts={buildNarrativeParts(content)} className={bodyClass} />

      <table className={cn('tdr-cert-table', compact && 'tdr-cert-table--compact')}>
        <tbody>
          {buildCertificateTableRows(content).map((row) => (
            <tr key={row.serial}>
              <td>{row.serial}</td>
              <td>{row.label}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <NarrativeText parts={buildPermissoryParts(content)} className={cn(bodyClass, 'mb-2')} />

      <SignatureBlocks />
    </CertPageShell>
  );
}

function CertificatePageTwo({ compact }: { compact?: boolean }) {
  return (
    <CertPageShell page={2} compact={compact}>
      <h3 className="tdr-cert-annexure-title">{ANNEXURE_I_TITLE}</h3>
      <p className={cn('tdr-cert-body mb-2 text-center', compact && 'tdr-cert-body--compact')}>
        {ANNEXURE_I_FORMULA}
      </p>
      {ANNEXURE_I_LEGEND.map((line) => (
        <p
          key={line}
          className={cn(
            'tdr-cert-body text-center text-slate-600',
            compact && 'tdr-cert-body--compact',
          )}
        >
          {line}
        </p>
      ))}

      <h3 className={cn('tdr-cert-annexure-title mt-8')}>{ANNEXURE_II_TITLE}</h3>
      <p
        className={cn(
          'tdr-cert-body mb-4 text-center font-bold uppercase',
          compact && 'tdr-cert-body--compact',
        )}
      >
        {ANNEXURE_II_HEADING}
      </p>
      <ol
        className={cn(
          'tdr-cert-body list-decimal space-y-2.5 pl-5',
          compact && 'tdr-cert-body--compact',
        )}
      >
        {ANNEXURE_II_TERMS.map((term) => (
          <li key={term.slice(0, 28)}>{term}</li>
        ))}
      </ol>
    </CertPageShell>
  );
}

function CertificatePageThree({
  data,
  compact,
}: {
  data: CertificatePreviewData;
  compact?: boolean;
}) {
  const content = toContentInput({
    tdrNumber: data.tdrNumber,
    tdrCertificateNumber: data.tdrCertificateNumber,
    holderName: data.holderName,
    relation: data.relation,
    village: data.village,
    mandal: data.mandal,
    district: data.district,
    surveyNumber: data.surveyNumber,
    ownershipDeedNo: data.ownershipDeedNo,
    surrenderedAreaSqYds: data.surrenderedAreaSqYds,
    tdrExtentSqYds: data.tdrExtentSqYds,
    issuedRatio: data.issuedRatio,
    issuedAt: data.issuedAt,
  });
  const ledger = buildLedgerRow(content);

  const meta = [
    { label: 'Holder Name', value: data.holderName },
    { label: 'Certificate No', value: data.tdrCertificateNumber },
    { label: 'Issue Date', value: ledger.date },
    { label: 'As on Date', value: formatCertificateDateTime(data.issuedAt) },
    { label: 'Balance', value: ledger.balance },
    { label: 'TDR Bond', value: data.tdrNumber },
  ];

  return (
    <CertPageShell page={3} compact={compact}>
      <h3 className="tdr-cert-annexure-title">{ANNEXURE_III_TITLE}</h3>
      <p className={cn('tdr-cert-annexure-title mb-5 mt-0')}>{ANNEXURE_III_SUBTITLE}</p>

      <dl className="tdr-cert-ledger-meta">
        {meta.map((item) => (
          <div key={item.label}>
            <dt>{item.label}: </dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto">
        <table className={cn('tdr-cert-table min-w-[540px]', compact && 'tdr-cert-table--compact')}>
          <thead>
            <tr className="bg-[#f8faf8]">
              {[
                'SNo',
                'Transaction Purpose',
                'Reference No.',
                'Transaction Date',
                'Recipient Name',
                'Utilized Of TDR(Sq.Yd.)',
                'Balance TDR Available(Sq.Yd.)',
              ].map((col) => (
                <th key={col} className="text-center font-bold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center">{ledger.serial}</td>
              <td className="text-center">{ledger.purpose}</td>
              <td>{ledger.reference}</td>
              <td className="text-center">{ledger.date}</td>
              <td>{ledger.recipient}</td>
              <td className="text-center">{ledger.utilized}</td>
              <td className="text-center font-bold">{ledger.balance}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        className={cn(
          'tdr-cert-body mt-5 font-mono text-slate-500',
          compact && 'tdr-cert-body--compact',
        )}
      >
        {data.tdrCertificateNumber}
      </p>
    </CertPageShell>
  );
}

export function TdrCertificatePreview({
  data,
  compact = false,
  className,
}: TdrCertificatePreviewProps) {
  const pages = (
    <>
      <CertificatePageOne data={data} compact={compact} />
      {!compact && (
        <>
          <CertificatePageTwo compact={compact} />
          <CertificatePageThree data={data} compact={compact} />
        </>
      )}
    </>
  );

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {pages}
        <p className="text-center font-sans text-[10px] text-slate-500">
          Annexures I–III are included in the downloadable PDF
        </p>
      </div>
    );
  }

  return <div className={cn('tdr-cert-viewer', className)}>{pages}</div>;
}
