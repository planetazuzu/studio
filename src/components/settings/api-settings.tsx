
'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveApiKeysAction } from '@/app/dashboard/settings/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Server, HelpCircle, Mail, MessageSquare, Bell } from 'lucide-react';
import Link from 'next/link';


export function ApiSettings() {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useFormState(saveApiKeysAction, { success: false, message: '' });

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
            if (state.success) {
                // No reseteamos el form para que el usuario vea los valores que puso,
                // aunque no se puedan leer de vuelta.
            }
        }
    }, [state, toast]);

    return (
         <Card>
            <CardHeader>
                <CardTitle>Configuración de APIs</CardTitle>
                <CardDescription>Gestiona las claves y URLs para servicios externos. Se guardan de forma segura como cookies de servidor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form ref={formRef} action={formAction} className="space-y-6">
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Server />Airtable (Base de Datos Remota)</h3>
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="airtable_api_key">Clave de API de Airtable</Label>
                                <Input id="airtable_api_key" name="airtable_api_key" type="password" placeholder="Introduce tu clave API de Airtable" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="airtable_base_id">ID de la Base de Airtable</Label>
                                <Input id="airtable_base_id" name="airtable_base_id" type="text" placeholder="appXXXXXXXXXXXXXX" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Bell />Firebase (Notificaciones Push)</h3>
                        <p className="text-sm text-muted-foreground">Necesario para enviar notificaciones push. Consulta la guía de despliegue para obtener estas credenciales de tu cuenta de servicio de Firebase.</p>
                         <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="firebase_client_email">Email del Cliente de Firebase</Label>
                                <Input id="firebase_client_email" name="firebase_client_email" type="email" placeholder="firebase-adminsdk-...@...iam.gserviceaccount.com" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="firebase_private_key">Clave Privada de Firebase</Label>
                                <Input id="firebase_private_key" name="firebase_private_key" type="password" placeholder="Introduce la clave privada (comienza con -----BEGIN PRIVATE KEY-----)" />
                            </div>
                        </div>
                    </div>


                     <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Mail/>SendGrid (Email)</h3>
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sendgrid_api_key">Clave API de SendGrid</Label>
                                <Input id="sendgrid_api_key" name="sendgrid_api_key" type="password" placeholder="Introduce tu clave API de SendGrid" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="sendgrid_from_email">Email Remitente</Label>
                                <Input id="sendgrid_from_email" name="sendgrid_from_email" type="email" placeholder="notificaciones@tu-empresa.com" />
                            </div>
                        </div>
                    </div>

                     <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare/>Twilio (WhatsApp)</h3>
                         <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="twilio_account_sid">Account SID de Twilio</Label>
                                <Input id="twilio_account_sid" name="twilio_account_sid" type="text" placeholder="AC..." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="twilio_auth_token">Auth Token de Twilio</Label>
                                <Input id="twilio_auth_token" name="twilio_auth_token" type="password" placeholder="Introduce tu Auth Token" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="twilio_whatsapp_from">Número de WhatsApp Remitente</Label>
                                <Input id="twilio_whatsapp_from" name="twilio_whatsapp_from" type="text" placeholder="+14155238886" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="twilio_whatsapp_to_test">Número de WhatsApp para Pruebas</Label>
                                <Input id="twilio_whatsapp_to_test" name="twilio_whatsapp_to_test" type="text" placeholder="+34123456789" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <Button type="submit">Guardar Todas las Configuraciones</Button>
                    </div>
                </form>

                <Alert className="mt-6 bg-blue-50 border-blue-200 text-blue-900">
                    <HelpCircle className="h-4 w-4 !text-blue-900" />
                    <AlertTitle>¿Necesitas ayuda para configurar Airtable?</AlertTitle>
                    <AlertDescription>
                        Hemos preparado una guía detallada que te explica paso a paso cómo obtener tus credenciales y crear las tablas necesarias.
                        <Button variant="link" asChild className="p-0 h-auto ml-1 text-blue-900 font-bold">
                            <Link href="/docs/airtable_setup.md" target="_blank">Consulta la guía de configuración aquí.</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
                 
                 <Alert className="mt-6">
                    <Server className="h-4 w-4" />
                    <AlertTitle>Nota sobre Despliegue en Producción</AlertTitle>
                    <AlertDescription>
                        Para un entorno de producción, se recomienda encarecidamente configurar estas claves como **variables de entorno** en tu plataforma de hosting (Vercel, Netlify, etc.) en lugar de guardarlas aquí. La aplicación buscará primero las variables de entorno. Consulta la documentación de despliegue para más detalles.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
