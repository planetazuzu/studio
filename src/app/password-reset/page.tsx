'use client';

import { Suspense } from 'react';
import { PasswordResetForm } from '@/components/password-reset-form';
import { Loader2 } from 'lucide-react';

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      }
    >
      <PasswordResetForm />
    </Suspense>
  );
}
