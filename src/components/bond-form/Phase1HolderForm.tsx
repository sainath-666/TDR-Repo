'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { createBondSchema } from '@/lib/validations/bond';
import { RelationType } from '@prisma/client';

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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="font-semibold text-lg">Phase 1 — Holder Details</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">TDR Number *</label>
          <input {...register('tdrNumber')} className="w-full border rounded px-3 py-2 mt-1" />
          {errors.tdrNumber && <p className="text-red-500 text-xs">{errors.tdrNumber.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input {...register('name')} className="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Relation Type *</label>
          <select {...register('relationType')} className="w-full border rounded px-3 py-2 mt-1">
            <option value={RelationType.S_O}>S/o</option>
            <option value={RelationType.D_O}>D/o</option>
            <option value={RelationType.W_O}>W/o</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Relation Name *</label>
          <input {...register('relationName')} className="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Aadhaar Number *</label>
          <input
            {...register('aadhaarNumber')}
            maxLength={12}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Aadhaar-linked Mobile *</label>
          <input
            {...register('aadhaarPhone')}
            maxLength={10}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Door No *</label>
          <input {...register('doorNo')} className="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Street/Locality *</label>
          <input {...register('street')} className="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Village *</label>
          <input {...register('village')} className="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Mandal *</label>
          <input {...register('mandal')} className="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">District *</label>
          <input
            {...register('district')}
            readOnly={!!officialDistrictCode}
            className="w-full border rounded px-3 py-2 mt-1 read-only:bg-gray-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-apcrda-primary text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Continue to Phase 2'}
      </button>
    </form>
  );
}
