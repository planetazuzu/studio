import { redirect } from 'next/navigation';

// This page is obsolete and now redirects to the main profile page.
export default function ObsoletePage() {
    redirect('/dashboard/profile');
}
