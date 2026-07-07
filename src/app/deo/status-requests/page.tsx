import { redirect } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import {
  getStatusCheckRequests,
  getStatusCheckRequestSummary,
} from '@/lib/queries/status-check-requests';
import { StatusCheckRequestsTable } from '@/components/dashboard/StatusCheckRequestsTable';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';

export const dynamic = 'force-dynamic';

export default async function DeoStatusRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/official-login');

  const [requests, summary] = await Promise.all([
    getStatusCheckRequests(),
    getStatusCheckRequestSummary(),
  ]);

  return (
    <div className="dashboard-shell">
      <div className="mb-4 shrink-0">
        <h1 className="text-lg font-bold text-apcrda-primary sm:text-xl">
          Request TDR Status Checks
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review citizen requests submitted when a TDR certificate number was not found.
        </p>
      </div>

      <div className="mb-4 grid shrink-0 grid-cols-2 gap-2.5 lg:max-w-md">
        <StatCard
          compact
          label="Total requests"
          value={summary.total}
          icon={ClipboardList}
          accent="primary"
        />
        <StatCard
          compact
          label="Pending"
          value={summary.pending}
          icon={ClipboardList}
          accent="amber"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Card padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {requests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No status check requests"
              description="Citizen requests will appear here when they submit a TDR status check from the public portal."
            />
          ) : (
            <div className="overflow-x-auto">
              <StatusCheckRequestsTable requests={requests} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
