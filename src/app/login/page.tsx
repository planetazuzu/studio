import { redirect } from '@/navigation';

// This page is kept for legacy routing, and immediately redirects
// to the correct, localized login page.
export default function DeprecatedLoginPage() {
  redirect('/login');
}
