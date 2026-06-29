'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2.5',
        'text-sm font-semibold text-white/90 transition-colors',
        'hover:border-white/35 hover:bg-white/15 hover:text-white',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
