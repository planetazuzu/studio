import './globals.css';
import { ReactNode } from 'react';

// This is the root layout. It's kept minimal and delegates the main
// HTML structure to the locale-specific layout.
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
