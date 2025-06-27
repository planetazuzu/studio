'use client';
// This layout is no longer used directly.
// The logic has been moved to `src/app/[locale]/dashboard/layout.tsx` to support i18n.
// This file can be deleted if your platform supports it.

import { Loader2 } from "lucide-react";

export default function DeprecatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Redirecting...</p>
    </div>
  )
}
