
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser) {
        toast({
            title: `Bienvenido, ${loggedInUser.name.split(' ')[0]}`,
            description: "Has iniciado sesión correctamente.",
        });
        router.push('/dashboard');
      } else {
        setError('Credenciales incorrectas.');
      }
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
          <CardTitle className="text-3xl font-bold">EmergenciaAI</CardTitle>
          <CardDescription>Plataforma de formación para emergencias sanitarias</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
             {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Autenticación</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nombre@empresa.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={formIsDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={formIsDisabled}
                />
            </div>
            <Button type="submit" className="w-full text-lg h-12" disabled={formIsDisabled}>
              {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {isAuthLoading ? 'Inicializando...' : 'Iniciando...'}</> : 'Iniciar Sesión'}
            </Button>
            <div className="text-center text-sm space-x-2">
                <span>¿No tienes cuenta?</span>
                <Link href="/register" className={`text-primary hover:underline font-semibold ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                    Regístrate
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
