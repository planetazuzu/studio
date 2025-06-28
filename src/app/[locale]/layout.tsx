import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AcademiaAI',
  description: 'La plataforma de formación impulsada por IA para tu equipo.',
};
 
export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Providing all messages to the client
  // side is the easiest way to get started.
  // By importing them directly, we can avoid issues with the `getMessages` helper.
  const messages = (await import(`../../../messages/${locale}.json`)).default;
 
  return (
    <html lang={locale} suppressHydrationWarning className={inter.className}>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background">
        <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
                {children}
            </AuthProvider>
            <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
