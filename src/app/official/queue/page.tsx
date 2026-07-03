import { redirect } from 'next/navigation';

/** Approval queue is integrated into the official dashboard (same as DEO portal). */
export default function OfficialQueuePage() {
  redirect('/official/dashboard');
}
