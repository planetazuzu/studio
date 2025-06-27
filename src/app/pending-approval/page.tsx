
import { redirect } from 'next/navigation';

export default function PendingApprovalPage() {
  // This page is part of the manual approval flow, which has been removed.
  // Redirect users to the dashboard as a fallback.
  redirect('/dashboard');
}
