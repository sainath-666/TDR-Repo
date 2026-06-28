'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RelationType } from '@prisma/client';
import { createBondSchema, phase2Schema, REQUIRED_DOCUMENT_TYPES } from '@/lib/validations/bond';
import type { z } from 'zod';
import { Phase1HolderForm } from './Phase1HolderForm';
import { Phase2LandForm } from './Phase2LandForm';
import { DocumentUploadPhase } from './DocumentUploadPhase';

type Phase1Data = z.infer<typeof createBondSchema>;
type Phase2Data = z.infer<typeof phase2Schema>;

export function BondEntryForm() {
  const [phase, setPhase] = useState(1);
  const [bondId, setBondId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const phase1Form = useForm<Phase1Data>({
    resolver: zodResolver(createBondSchema),
    defaultValues: { relationType: RelationType.S_O },
  });

  const phase2Form = useForm<Phase2Data>({
    resolver: zodResolver(phase2Schema),
    defaultValues: { issuedRatio: '1:1' },
  });

  async function submitPhase1(data: Phase1Data) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setBondId(result.data.bondId);
      setPhase(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create bond');
    } finally {
      setLoading(false);
    }
  }

  async function submitPhase2(data: Phase2Data) {
    if (!bondId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bonds/${bondId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase2: data }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setPhase(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save land details');
    } finally {
      setLoading(false);
    }
  }

  async function submitBond() {
    if (!bondId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bonds/${bondId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ confirmSubmit: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      window.location.href = '/deo/dashboard';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit bond');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3].map((p) => (
          <div
            key={p}
            className={`flex-1 h-2 rounded ${phase >= p ? 'bg-apcrda-primary' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {phase === 1 && (
        <Phase1HolderForm form={phase1Form} onSubmit={submitPhase1} loading={loading} />
      )}
      {phase === 2 && (
        <Phase2LandForm
          form={phase2Form}
          onSubmit={submitPhase2}
          loading={loading}
          bondId={bondId!}
        />
      )}
      {phase === 3 && bondId && (
        <DocumentUploadPhase
          bondId={bondId}
          requiredTypes={REQUIRED_DOCUMENT_TYPES}
          onComplete={submitBond}
          loading={loading}
        />
      )}
    </div>
  );
}
