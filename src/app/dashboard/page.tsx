
'use client';

import { useRouter } from 'next/navigation';

// This is a client-side component that immediately redirects to the main dashboard page.
export default function DashboardRedirectPage() {
  const router = useRouter();
  router.replace('/dashboard/dashboard');
  return null;
}
