'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { phase2Schema } from '@/lib/validations/bond';

type Phase2Data = z.infer<typeof phase2Schema>;

interface Props {
  form: UseFormReturn<Phase2Data>;
  onSubmit: (data: Phase2Data) => void;
  loading: boolean;
  bondId: string;
}

export function Phase2LandForm({ form, onSubmit, loading, bondId }: Props) {
  const { register, handleSubmit } = form;

  async function verifyGis() {
    const surveyNo = form.getValues('surveyNumber');
    if (!surveyNo) return;
    const res = await fetch(`/api/bonds/prefill/${encodeURIComponent(surveyNo)}`);
    const data = await res.json();
    if (data.success && data.data.gis) {
      form.setValue('surrenderedAreaSqYds', data.data.gis.areaSqYds);
      form.setValue('surrenderedVillage', data.data.gis.village);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="font-semibold text-lg">Phase 2 — Land Details</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Surrendered Village *</label>
          <input
            {...register('surrenderedVillage')}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Survey Number *</label>
          <div className="flex gap-2 mt-1">
            <input {...register('surveyNumber')} className="flex-1 border rounded px-3 py-2" />
            <button type="button" onClick={verifyGis} className="text-sm bg-slate-100 px-3 rounded">
              Verify on GIS
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Ownership Deed No</label>
          <input
            {...register('ownershipDeedNo')}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Surrendered Area (Sq Yards) *</label>
          <input
            {...register('surrenderedAreaSqYds', { valueAsNumber: true })}
            type="number"
            step="0.0001"
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">TDR Issued Extent (Sq Yards) *</label>
          <input
            {...register('tdrIssuedExtentSqYds', { valueAsNumber: true })}
            type="number"
            step="0.0001"
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Issued Ratio (Authority-decided) *</label>
          <input
            {...register('issuedRatio')}
            placeholder="1:1"
            className="w-full border rounded px-3 py-2 mt-1"
          />
          <p className="text-xs text-slate-400 mt-1">Do not modify — as decided by Authority</p>
        </div>
      </div>

      <input type="hidden" value={bondId} />
      <button
        type="submit"
        disabled={loading}
        className="bg-apcrda-primary text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Continue to Documents'}
      </button>
    </form>
  );
}
