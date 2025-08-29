'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, Gitlab } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { users as testUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

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
        setError("Credenciales incorrectas.");
      }
    } catch (err: any) {
      if (err.message.includes('desactivada')) {
        setError("Esta cuenta ha sido desactivada. Contacta con un administrador.");
      } else if (err.message.includes('pendiente de aprobación')) {
        setError("Esta cuenta está pendiente de aprobación por un administrador.");
      }
      else {
        setError("Credenciales incorrectas o usuario no encontrado.");
      }
      console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };
  
  const formIsDisabled = isAuthLoading || isSubmitting;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">TalentOS</CardTitle>
          </Link>
          <CardDescription>La plataforma de formación impulsada por IA para tu equipo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link href="/forgot-password" className={`text-sm text-primary hover:underline ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                        ¿Has olvidado tu contraseña?
                    </Link>
                </div>
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
              {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {isAuthLoading ? "Iniciando..." : "Iniciando..."}</></> : "Iniciar Sesión"}
            </Button>
            <div className="text-center text-sm space-x-1">
                <span>¿No tienes cuenta?</span>
                <Link href="/register" className={`text-primary hover:underline font-semibold ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                    Regístrate
                </Link>
            </div>
          </form>

           <div className="mt-6">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                          O inicia sesión con un proveedor
                      </span>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button variant="outline" onClick={() => handleOAuthLogin('google')}>
                      <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.85 1.62-4.75 0-8.58-3.83-8.58-8.58s3.83-8.58 8.58-8.58c2.6 0 4.5 1.05 5.9 2.4l2.17-2.17C19.33 1.62 16.25 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.34 0 12.04-4.92 12.04-12.04 0-.76-.08-1.5-.2-2.24h-9.84z"></path></svg>
                      Google
                  </Button>
                   <Button variant="outline" onClick={() => handleOAuthLogin('github')}>
                      <Gitlab className="mr-2 h-4 w-4" />
                      Gitlab
                  </Button>
              </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cuentas de Prueba</CardTitle>
          <CardDescription>Haz clic en un usuario para rellenar automáticamente sus credenciales.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-center gap-4">
          {testUsers.map(testUser => (
            <button
              key={testUser.id}
              onClick={() => {
                setEmail(testUser.email);
                setPassword(testUser.password!);
              }}
              className="flex flex-col items-center gap-2 text-center text-xs hover:bg-muted p-2 rounded-lg transition-colors"
              disabled={formIsDisabled}
            >
              <Avatar>
                <AvatarImage src={testUser.avatar} alt={testUser.name} />
                <AvatarFallback>{testUser.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{testUser.name}</span>
              <span className="text-muted-foreground">{testUser.role}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
