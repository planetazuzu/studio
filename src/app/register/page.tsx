import { redirect } from '@/navigation';

// This page is kept for legacy routing, and immediately redirects
// to the correct, localized register page.
export default function DeprecatedRegisterPage() {
  redirect('/register');
}
