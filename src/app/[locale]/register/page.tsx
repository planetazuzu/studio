
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
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
        setError("La contraseña debe tener al menos 8 caracteres.");
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
        title: "Registro completado",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
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
          <CardTitle className="text-3xl font-bold">Crear una Cuenta</CardTitle>
          <CardDescription>Regístrate para acceder a la plataforma de formación.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
             {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Registro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="Tu nombre y apellidos" 
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
                placeholder="Debe tener al menos 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={formIsDisabled}
              />
            </div>
            <Button type="submit" className="w-full text-lg h-12" disabled={formIsDisabled}>
              {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Registrando...</> : "Crear Cuenta"}
            </Button>
            <div className="text-center text-sm space-x-1">
              <span>¿Ya tienes una cuenta?</span>
              <Link href="/login" className={`text-primary hover:underline font-semibold ${formIsDisabled ? 'pointer-events-none opacity-50' : ''}`}>
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
