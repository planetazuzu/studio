
import { redirect } from '@/navigation';

// This component is a fallback to redirect any stray requests
// from the old /dashboard path to the new, localized path.
export default function DashboardRedirectPage() {
  redirect('/dashboard');
}
