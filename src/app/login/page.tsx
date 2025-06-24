
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/icons';
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { users } from '@/lib/data';
import type { User } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const demoUsers: User[] = [
    users.find(u => u.role === 'Administrador General')!,
    users.find(u => u.role === 'Jefe de Formación')!,
    users.find(u => u.role === 'Gestor de RRHH')!,
    users.find(u => u.role === 'Formador')!,
    users.find(u => u.role === 'Trabajador' && u.department === 'Técnicos de Emergencias')!,
].filter(Boolean); // Filter out potential undefined if a role isn't found

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('elena.vargas@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // This effect handles redirection if the user is already logged in
    // or after a successful login.
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser) {
        toast({
            title: `Bienvenido, ${loggedInUser.name.split(' ')[0]}`,
            description: "Has iniciado sesión correctamente.",
        });
        // The redirect is now handled by the useEffect hook, which waits for the `user` state to update.
      } else {
        setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      setError('Ha ocurrido un error inesperado durante el inicio de sesión.');
      console.error(err);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDemoUserLogin = (user: User) => {
    if (user.email && user.password) {
        setEmail(user.email);
        setPassword(user.password);
    }
  };

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
                />
            </div>
            <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
            <div className="text-center text-sm">
              <a href="#" className="text-primary hover:underline">
                ¿Has olvidado tu contraseña?
              </a>
            </div>
          </form>
          
           <div className="mt-8">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Cuentas de Demostración</span>
                  </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {demoUsers.map((demoUser) => (
                      <button
                          key={demoUser.id}
                          onClick={() => handleDemoUserLogin(demoUser)}
                          className="flex items-center gap-3 w-full p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left"
                      >
                          <Avatar className="h-9 w-9">
                              <AvatarImage src={demoUser.avatar} alt={demoUser.name} />
                              <AvatarFallback>{demoUser.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="text-sm font-semibold">{demoUser.name}</p>
                              <p className="text-xs text-muted-foreground">{demoUser.role}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
