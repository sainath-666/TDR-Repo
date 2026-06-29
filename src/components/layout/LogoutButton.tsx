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
        'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
        'text-slate-400 hover:bg-white/5 hover:text-white transition-colors',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
