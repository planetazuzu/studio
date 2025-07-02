import { redirect } from 'next/navigation';

// This page is obsolete and now redirects to the main preferences page.
export default function ObsoletePage() {
    redirect('/dashboard/preferences');
}
