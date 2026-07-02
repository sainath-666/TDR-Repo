'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { createBondSchema } from '@/lib/validations/bond';
import { RelationType } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Phone, Mail, Home, Fingerprint, FileText } from 'lucide-react';

type Phase1Data = z.infer<typeof createBondSchema>;

interface Props {
  form: UseFormReturn<Phase1Data>;
  onSubmit: (data: Phase1Data) => void;
  loading: boolean;
  officialDistrictCode?: string;
}

export function Phase1HolderForm({ form, onSubmit, loading, officialDistrictCode }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Holder Identity Details */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <User className="h-5 w-5 text-apcrda-primary" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Holder Identity Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">TDR Number *</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  {...register('tdrNumber')}
                  placeholder="e.g. APCRDA/TDR/2026/001"
                  className="input-field pl-10"
                />
              </div>
              {errors.tdrNumber && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.tdrNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="field-label">Name *</label>
                <input
                  {...register('name')}
                  placeholder="Full name as in documents"
                  className="input-field"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="field-label whitespace-nowrap">Relation *</label>
                <select
                  {...register('relationType')}
                  className="input-field appearance-none bg-no-repeat bg-right pr-6 pl-3"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2.5\' d=\'M19 9l-7 7-7-7\'/></svg>")',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '0.85rem'
                  }}
                >
                  <option value={RelationType.S_O}>S/o</option>
                  <option value={RelationType.D_O}>D/o</option>
                  <option value={RelationType.W_O}>W/o</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="field-label">Relation Name *</label>
                <input
                  {...register('relationName')}
                  placeholder="Father/Spouse name"
                  className="input-field"
                />
                {errors.relationName && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.relationName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Aadhaar Number *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Fingerprint className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    {...register('aadhaarNumber')}
                    maxLength={12}
                    placeholder="12-digit number"
                    className="input-field pl-10"
                  />
                </div>
                {errors.aadhaarNumber && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.aadhaarNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="field-label">Aadhaar-linked Mobile *</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    {...register('aadhaarPhone')}
                    maxLength={10}
                    placeholder="10-digit mobile"
                    className="input-field pl-10"
                  />
                </div>
                {errors.aadhaarPhone && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">
                    {errors.aadhaarPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="field-label">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="e.g. name@domain.com"
                  className="input-field pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Card 2: Communication Address */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <Home className="h-5 w-5 text-apcrda-primary" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Residential Address
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="field-label">Door No *</label>
                <input
                  {...register('doorNo')}
                  placeholder="e.g. 4-12/A"
                  className="input-field"
                />
                {errors.doorNo && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.doorNo.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Street/Locality *</label>
                <input
                  {...register('street')}
                  placeholder="Street / Colony / Landmark"
                  className="input-field"
                />
                {errors.street && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.street.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Village *</label>
                <input
                  {...register('village')}
                  placeholder="Village name"
                  className="input-field"
                />
                {errors.village && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.village.message}</p>
                )}
              </div>

              <div>
                <label className="field-label">Mandal *</label>
                <input
                  {...register('mandal')}
                  placeholder="Mandal name"
                  className="input-field"
                />
                {errors.mandal && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.mandal.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="field-label">District *</label>
              <input
                {...register('district')}
                readOnly={!!officialDistrictCode}
                className="input-field read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-not-allowed"
                placeholder="District name"
              />
              {errors.district && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.district.message}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          variant="primary"
          className="w-full sm:w-auto shadow-md"
        >
          {loading ? 'Saving details...' : 'Continue to Phase 2'}
        </Button>
      </div>
    </form>
  );
}
