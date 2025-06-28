import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth';
 
export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
 
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
            {children}
        </AuthProvider>
        <Toaster />
    </NextIntlClientProvider>
  );
}
