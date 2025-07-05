import { ReactNode } from 'react';

// This layout is being disabled to prevent conflicts with the main /src/app/layout.tsx
// It was causing server crashes by importing a non-existent package.
export default function DisabledLocaleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
