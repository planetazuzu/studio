'use client';

import { useState } from 'react';
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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('elena.vargas@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (user) {
        toast({
            title: `Bienvenido, ${user.name.split(' ')[0]}`,
            description: "Has iniciado sesión correctamente.",
        });
        router.push('/dashboard');
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
        </CardContent>
      </Card>
    </div>
  );
}
