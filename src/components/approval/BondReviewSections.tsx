'use client';

import { CheckCircle2, Circle, ExternalLink, FileText, Compass, User } from 'lucide-react';
import type { TdrBondWithRelations } from '@/types';
import { Card } from '@/components/ui/Card';

type ReviewDocument = TdrBondWithRelations['documents'][number];
import type { BondReviewDisplay } from '@/lib/bond-review-display';
import {
  DOCUMENT_REVIEW_SPECS,
  HOLDER_REVIEW_FIELDS,
  LAND_REVIEW_FIELDS,
} from '@/lib/bond-review-fields';
import { cn } from '@/lib/utils';

function SectionTitle({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-apcrda-primary/10 ring-1 ring-apcrda-primary/15">
          <Icon className="h-4 w-4 text-apcrda-primary" />
        </div>
        <h3 className="text-sm font-semibold text-apcrda-primary truncate">{title}</h3>
      </div>
      {badge}
    </div>
  );
}

function FieldList({
  fields,
  values,
  columns = 3,
}: {
  fields: readonly { key: string; label: string }[];
  values: Record<string, string>;
  columns?: 3 | 4 | 5;
}) {
  const colClass =
    columns === 5
      ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <dl className={cn('grid grid-cols-1 gap-x-5 gap-y-3.5 p-4', colClass)}>
      {fields.map((field) => (
        <div key={field.key} className="min-w-0">
          <dt className="text-[11px] font-medium text-slate-500 leading-tight">{field.label}</dt>
          <dd className="text-sm font-semibold text-slate-900 mt-0.5 break-words leading-snug">
            {values[field.key] || '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function HolderSection({ display }: { display: BondReviewDisplay }) {
  return (
    <Card padding="none" className="h-full">
      <SectionTitle icon={User} title="1. Address of the TDR Holder" />
      <FieldList fields={HOLDER_REVIEW_FIELDS} values={display.holder} columns={5} />
    </Card>
  );
}

function LandSection({ display }: { display: BondReviewDisplay }) {
  return (
    <Card padding="none" className="h-full">
      <SectionTitle icon={Compass} title="2. Details of the Land Surrendered" />
      {!display.land ? (
        <p className="m-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          Land surrender details were not received from the external APCRDA system.
        </p>
      ) : (
        <FieldList fields={LAND_REVIEW_FIELDS} values={display.land} columns={4} />
      )}
    </Card>
  );
}

function DocumentsSection({
  bond,
  onViewDocument,
}: {
  bond: TdrBondWithRelations;
  onViewDocument: (doc: ReviewDocument) => void;
}) {
  const uploadedByType = new Map(bond.documents.map((d) => [d.docType, d]));
  const attachedCount = DOCUMENT_REVIEW_SPECS.filter((s) => uploadedByType.has(s.type)).length;

  return (
    <Card padding="none">
      <SectionTitle
        icon={FileText}
        title="3. Documents to Upload"
        badge={
          <span className="text-[10px] font-bold text-apcrda-primary bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full shrink-0">
            {attachedCount} of {DOCUMENT_REVIEW_SPECS.length} attached
          </span>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4">
        {DOCUMENT_REVIEW_SPECS.map((spec) => {
          const doc = uploadedByType.get(spec.type);
          const isAttached = Boolean(doc);

          return (
            <div
              key={spec.type}
              className={cn(
                'flex flex-col rounded-xl border p-3 transition-shadow hover:shadow-sm',
                isAttached
                  ? 'border-emerald-200/80 bg-emerald-50/30'
                  : 'border-amber-200/80 bg-amber-50/20',
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                    isAttached ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {isAttached ? <CheckCircle2 className="h-3.5 w-3.5" /> : spec.order}
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-snug flex-1 min-w-0">
                  {spec.label}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60">
                {doc ? (
                  <button
                    type="button"
                    onClick={() => onViewDocument(doc)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-apcrda-primary hover:text-apcrda-primary-light"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View document
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <Circle className="h-2 w-2 fill-current" />
                    Not received
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function BondReviewBody({
  bond,
  display,
  onViewDocument,
}: {
  bond: TdrBondWithRelations;
  display: BondReviewDisplay;
  onViewDocument: (doc: ReviewDocument) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <HolderSection display={display} />
        <LandSection display={display} />
      </div>
      <DocumentsSection bond={bond} onViewDocument={onViewDocument} />
    </div>
  );
}

export function HolderReviewSection({ display }: { display: BondReviewDisplay }) {
  return <HolderSection display={display} />;
}

export function LandReviewSection({ display }: { display: BondReviewDisplay }) {
  return <LandSection display={display} />;
}

export function DocumentsReviewSection({
  bond,
  onViewDocument,
}: {
  bond: TdrBondWithRelations;
  onViewDocument: (doc: ReviewDocument) => void;
}) {
  return <DocumentsSection bond={bond} onViewDocument={onViewDocument} />;
}
