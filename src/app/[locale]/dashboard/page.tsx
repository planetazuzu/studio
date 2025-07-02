import { redirect } from 'next/navigation';

// This page is obsolete and now redirects to the main dashboard page.
export default function ObsoleteDashboardPage() {
    redirect('/dashboard');
}
