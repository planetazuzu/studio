
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/navigation';

export default function RegisterPage() {
  const t = useTranslations('RegisterPage');
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
        setError(t('passwordMinLength'));
        return;
    }

    setIsSubmitting(true);
    try {
      await db.addUser({
        name,
        email,
        password,
        role: 'Trabajador',
        department: 'Técnicos de Emergencias'
      });
      toast({
        title: t('registrationSuccessTitle'),
        description: t('registrationSuccessDescription'),
      });
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error inesperado.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formIsDisabled = isAuthLoading || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <AppLogo className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
             {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t('registerErrorTitle')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('nameLabel')}</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder={t('namePlaceholder')} 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={formIsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="tu.correo@empresa.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formIsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={formIsDisabled}
              />
            </div>
            <Button type="submit" className="w-full text-lg h-12" disabled={formIsDisabled}>
              {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {t('submittingButton')}</> : t('createAccountButton')}
            </Button>
            <div className="text-center text-sm space-x-1">
              <span>{t('hasAccount')}</span>
              <Link href="/login" className={`text-primary hover:underline font-semibold ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                {t('loginLink')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
