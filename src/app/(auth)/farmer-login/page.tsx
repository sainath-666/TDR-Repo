import { Suspense } from 'react';
import FarmerLoginClient from './FarmerLoginClient';

export default function FarmerLoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}
    >
      <FarmerLoginClient />
    </Suspense>
  );
}
