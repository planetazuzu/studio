import './globals.css';
import { Inter } from 'next/font/google';
 
const inter = Inter({ subsets: ['latin'] });
 
export const metadata = {
  title: 'AcademiaAI',
  description: 'La plataforma de formación impulsada por IA para tu equipo.',
};
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.className}>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background">
        {children}
      </body>
    </html>
  );
}
