import { redirect } from 'next/navigation';

// This page is obsolete and now redirects to the main login page.
export default function ObsoleteLoginPage() {
    redirect('/login');
}
