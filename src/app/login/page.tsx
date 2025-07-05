'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { users as testUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

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
  
  const formIsDisabled = isAuthLoading || isSubmitting;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 gap-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">AcademiaAI</CardTitle>
          </Link>
          <CardDescription>La plataforma de formación impulsada por IA para tu equipo.</CardDescription>
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
              {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {isAuthLoading ? "Iniciando..." : "Iniciando..."}</> : "Iniciar Sesión"}
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
                          O inicia sesión con una cuenta de prueba
                      </span>
                  </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {testUsers.map((testUser) => (
                      <Button
                          key={testUser.id}
                          variant="outline"
                          className="h-auto justify-start gap-3 p-3 text-left"
                          onClick={() => {
                              setEmail(testUser.email);
                              setPassword(testUser.password || '');
                          }}
                          disabled={formIsDisabled}
                      >
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={testUser.avatar} />
                              <AvatarFallback>{testUser.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{testUser.name}</p>
                              <p className="text-xs text-muted-foreground">{testUser.role}</p>
                          </div>
                      </Button>
                  ))}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
