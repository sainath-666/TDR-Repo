import { Suspense } from 'react';
import OfficialLoginClient from './OfficialLoginClient';

export default function OfficialLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg mx-auto text-center py-12 text-slate-500">Loading...</div>
      }
    >
      <OfficialLoginClient />
    </Suspense>
  );
}
