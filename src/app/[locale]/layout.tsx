
import { ReactNode } from 'react';

// This layout is now obsolete after removing i18n.
// The main layout in `src/app/layout.tsx` handles everything.
// This file is kept to prevent "not found" errors on existing builds
// but it just passes children through.
export default function LocaleLayout({
  children
}: {
  children: ReactNode;
}) {
  return children;
}
