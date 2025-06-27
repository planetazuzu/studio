// This root layout is required by Next.js.
// It should not contain any `<html>` or `<body>` tags or locale-specific logic.
// The main structure is delegated to the locale-specific layout in `[locale]/layout.tsx`.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
