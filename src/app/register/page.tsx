
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, Gitlab } from 'lucide-react';
import * as db from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { roles } from '@/lib/data';
import type { Role } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';

const registerSchema = z.object({
  name: z.string().min(2, { message: "El nombre es obligatorio." }),
  email: z.string().email({ message: "Por favor, introduce un correo válido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  role: z.enum(roles as [string, ...string[]], { required_error: "Debes seleccionar un rol." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
        name: '',
        email: '',
        password: '',
        role: undefined,
      }
  });


  const handleRegister = async (data: RegisterFormValues) => {
    setError('');
    setIsSubmitting(true);
    try {
      const newUser = await db.addUser(data);
      
      if(newUser.status === 'pending_approval') {
          router.push('/pending-approval');
      } else {
          toast({
            title: "Registro completado",
            description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
          });
          router.push('/login');
      }
    } catch (err: any) {
      if (err.message.includes('Este correo electrónico ya está en uso.')) {
          form.setError('email', { type: 'manual', message: 'Este correo electrónico ya está en uso.' });
      } else {
        setError(err.message || 'Ha ocurrido un error inesperado.');
        console.error(err);
      }
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <AppLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">TalentOS</CardTitle>
          </Link>
          <CardDescription>Crea una cuenta para acceder a la plataforma de formación.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
             {error && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Registro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" placeholder="Tu nombre y apellidos" {...field} disabled={formIsDisabled} />
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                )}
            />
             <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="tu.correo@empresa.com" {...field} disabled={formIsDisabled} />
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                )}
            />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...field} disabled={formIsDisabled} />
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                )}
            />
            <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                    <div className="space-y-2">
                         <Label htmlFor="role">¿Cómo quieres registrarte?</Label>
                        <Select onValueChange={field.onChange} value={field.value} disabled={formIsDisabled}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Selecciona un rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                         <p className="text-xs text-muted-foreground">Los roles de gestión requieren aprobación de un administrador.</p>
                    </div>
                )}
            />

             <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row-reverse">
                <Button type="submit" className="w-full sm:w-auto" disabled={formIsDisabled}>
                  {formIsDisabled ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Registrando...</> : "Crear Cuenta"}
                </Button>
                 <Button asChild variant="outline" className="w-full sm:w-auto" disabled={formIsDisabled}>
                    <Link href="/login">
                        Volver
                    </Link>
                </Button>
            </div>
          </form>

           <div className="mt-6">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                          O regístrate con un proveedor
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
    </div>
  );
}
