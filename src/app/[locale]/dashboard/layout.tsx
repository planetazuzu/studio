import { ReactNode } from 'react';

// This layout is obsolete and now just passes children through
// to the main dashboard layout at src/app/dashboard/layout.tsx.
export default function ObsoleteDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
