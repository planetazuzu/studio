'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('NotFoundPage');
  
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-2xl">
             <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <SearchX className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 text-3xl font-bold">{t('title')}</CardTitle>
                <CardDescription>
                    {t('description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/dashboard">{t('backToDashboard')}</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  )
}
