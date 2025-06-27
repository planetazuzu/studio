// This layout now simply passes through its children, as the main
// layout logic has been moved to the root layout in `src/app/layout.tsx`
// to comply with Next.js conventions.
export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
