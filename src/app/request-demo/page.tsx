
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const demoRequestSchema = z.object({
  name: z.string().min(2, { message: "El nombre es obligatorio." }),
  company: z.string().min(2, { message: "El nombre de la empresa es obligatorio." }),
  email: z.string().email({ message: "Por favor, introduce un correo válido." }),
  message: z.string().optional(),
});

type DemoRequestFormValues = z.infer<typeof demoRequestSchema>;

export default function RequestDemoPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<DemoRequestFormValues>({
        resolver: zodResolver(demoRequestSchema),
        defaultValues: {
            name: '',
            company: '',
            email: '',
            message: '',
        }
    });

    const onSubmit = async (data: DemoRequestFormValues) => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Demo Request Data:', data);

        toast({
            title: "¡Solicitud Enviada!",
            description: "Gracias por tu interés. Nos pondremos en contacto contigo pronto.",
        });

        setIsSubmitting(false);
        form.reset();
        router.push('/');
    };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">TalentOS</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/features">Ver Funcionalidades</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl">Solicita una Demo Personalizada</CardTitle>
                <CardDescription>Déjanos tus datos y uno de nuestros especialistas te mostrará cómo TalentOS puede transformar la formación en tu empresa.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="company" render={({ field }) => ( <FormItem><FormLabel>Empresa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="message" render={({ field }) => ( <FormItem><FormLabel>Mensaje (Opcional)</FormLabel><FormControl><Textarea placeholder="Cuéntanos un poco sobre tus necesidades..." {...field} /></FormControl><FormMessage /></FormItem> )}/>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Solicitud
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
