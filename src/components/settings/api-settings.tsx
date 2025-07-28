
'use client';

import { useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveApiKeysAction } from '@/app/dashboard/settings/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Server, HelpCircle, Mail, MessageSquare, Bell, Database } from 'lucide-react';

export function ApiSettings() {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(saveApiKeysAction, { success: false, message: '' });

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
    }, [state, toast]);

    return (
         <Card>
            <CardHeader>
                <CardTitle>Configuración de APIs Externas</CardTitle>
                <CardDescription>Gestiona las claves para servicios externos como email, WhatsApp y notificaciones push.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form ref={formRef} action={formAction} className="space-y-6">
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Database />Supabase (Sincronización)</h3>
                        <p className="text-sm text-muted-foreground">Necesario para la sincronización de datos. Esta clave permite al servidor escribir en la base de datos de Supabase. Obténla en `Project Settings > API`.</p>
                         <div className="space-y-2">
                            <Label htmlFor="supabase_service_role_key">Clave de Rol de Servicio de Supabase</Label>
                            <Input id="supabase_service_role_key" name="supabase_service_role_key" type="password" placeholder="Introduce la clave 'service_role'" />
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
                        <Button type="submit">Guardar Configuraciones de APIs</Button>
                    </div>
                </form>
                 
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
