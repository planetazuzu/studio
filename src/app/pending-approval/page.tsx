
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/icons';
import { Hourglass } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Hourglass className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Solicitud Recibida</CardTitle>
          <CardDescription>Tu cuenta está pendiente de aprobación.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Un administrador revisará tu solicitud en breve. Recibirás una notificación por correo electrónico una vez que tu cuenta haya sido aprobada y puedas iniciar sesión.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/login">Volver a Inicio de Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
