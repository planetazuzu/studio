import { redirect } from 'next/navigation';

// This page is obsolete and now redirects to the main register page.
export default function ObsoleteRegisterPage() {
    redirect('/register');
}
