'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { phase2Schema } from '@/lib/validations/bond';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Compass, FileText, Ruler, ShieldAlert } from 'lucide-react';

type Phase2Data = z.infer<typeof phase2Schema>;

interface Props {
  form: UseFormReturn<Phase2Data>;
  onSubmit: (data: Phase2Data) => void;
  loading: boolean;
  bondId: string;
}

export function Phase2LandForm({ form, onSubmit, loading, bondId }: Props) {
  const { 
    register, 
    handleSubmit,
    formState: { errors }
  } = form;

  async function verifyGis() {
    const surveyNo = form.getValues('surveyNumber');
    if (!surveyNo) return;
    try {
      const res = await fetch(`/api/bonds/prefill/${encodeURIComponent(surveyNo)}`);
      const data = await res.json();
      if (data.success && data.data.gis) {
        form.setValue('surrenderedAreaSqYds', data.data.gis.areaSqYds);
        form.setValue('surrenderedVillage', data.data.gis.village);
      }
    } catch (e) {
      console.error('Failed to verify GIS:', e);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Location Details */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <Compass className="h-5 w-5 text-apcrda-primary" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Location & Survey Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">Survey Number *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    {...register('surveyNumber')}
                    placeholder="e.g. 124/2A or 45/1"
                    className="input-field pl-10"
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyGis}
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-[46px] rounded-xl border-2 border-apcrda-accent/20 bg-apcrda-accent/10 text-xs font-semibold text-apcrda-accent hover:bg-apcrda-accent/20 hover:border-apcrda-accent active:bg-apcrda-accent/30 transition-all duration-200 shrink-0"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Verify on GIS
                </button>
              </div>
              {errors.surveyNumber && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.surveyNumber.message}</p>
              )}
            </div>

            <div>
              <label className="field-label">Surrendered Village *</label>
              <input
                {...register('surrenderedVillage')}
                placeholder="Village name (prefilled or manual)"
                className="input-field"
              />
              {errors.surrenderedVillage && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.surrenderedVillage.message}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">Ownership Deed No</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  {...register('ownershipDeedNo')}
                  placeholder="e.g. 1045/2024"
                  className="input-field pl-10"
                />
              </div>
              {errors.ownershipDeedNo && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.ownershipDeedNo.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Card B: Calculations & Area Extent */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <Ruler className="h-5 w-5 text-apcrda-primary" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Area & TDR Extent
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">Surrendered Area (Sq Yards) *</label>
              <input
                {...register('surrenderedAreaSqYds', { valueAsNumber: true })}
                type="number"
                step="0.0001"
                placeholder="0.0000"
                className="input-field font-mono"
              />
              {errors.surrenderedAreaSqYds && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.surrenderedAreaSqYds.message}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">TDR Issued Extent (Sq Yards) *</label>
              <input
                {...register('tdrIssuedExtentSqYds', { valueAsNumber: true })}
                type="number"
                step="0.0001"
                placeholder="0.0000"
                className="input-field font-mono"
              />
              {errors.tdrIssuedExtentSqYds && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.tdrIssuedExtentSqYds.message}
                </p>
              )}
            </div>

            <div>
              <label className="field-label flex justify-between items-center">
                <span>Issued Ratio (Authority-decided) *</span>
                <span className="text-[10px] text-slate-400 font-normal">Read-only field</span>
              </label>
              <input
                {...register('issuedRatio')}
                placeholder="1:1"
                readOnly
                className="input-field bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
              />
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-indigo-50/55 p-2 border border-indigo-100/50">
                <ShieldAlert className="h-3.5 w-3.5 text-apcrda-primary shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight text-slate-500">
                  The issued ratio is decided based on regulatory policies and standard land pooling metrics of the Authority.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <input type="hidden" value={bondId} />
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          variant="primary"
          className="w-full sm:w-auto shadow-md"
        >
          {loading ? 'Saving land details...' : 'Continue to Documents'}
        </Button>
      </div>
    </form>
  );
}
