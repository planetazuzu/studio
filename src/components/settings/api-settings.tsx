
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
import { Server, HelpCircle, Mail, MessageSquare } from 'lucide-react';
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
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Server />NocoDB (Base de Datos Remota)</h3>
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nocodbApiUrl">URL de la API de NocoDB</Label>
                                <Input id="nocodbApiUrl" name="nocodbApiUrl" type="text" placeholder="https://mi.nocodb.instance/api/v2" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="nocodbAuthToken">Token de Autenticación (xc-token)</Label>
                                <Input id="nocodbAuthToken" name="nocodbAuthToken" type="password" placeholder="Introduce tu token de API de NocoDB" />
                            </div>
                        </div>
                    </div>

                     <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Mail/>SendGrid (Email)</h3>
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sendgridApiKey">Clave API de SendGrid</Label>
                                <Input id="sendgridApiKey" name="sendgrid_api_key" type="password" placeholder="Introduce tu clave API de SendGrid" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="sendgridFromEmail">Email Remitente</Label>
                                <Input id="sendgridFromEmail" name="sendgrid_from_email" type="email" placeholder="notificaciones@tu-empresa.com" />
                            </div>
                        </div>
                    </div>

                     <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare/>Twilio (WhatsApp)</h3>
                         <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="twilioAccountSid">Account SID de Twilio</Label>
                                <Input id="twilioAccountSid" name="twilio_account_sid" type="text" placeholder="AC..." />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="twilioAuthToken">Auth Token de Twilio</Label>
                                <Input id="twilioAuthToken" name="twilio_auth_token" type="password" placeholder="Introduce tu Auth Token" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="twilioFromPhone">Número de WhatsApp Remitente</Label>
                                <Input id="twilioFromPhone" name="twilio_whatsapp_from" type="text" placeholder="+14155238886" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="twilioToTest">Número de WhatsApp para Pruebas</Label>
                                <Input id="twilioToTest" name="twilio_whatsapp_to_test" type="text" placeholder="+34123456789" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <Button type="submit">Guardar Todas las Configuraciones</Button>
                    </div>
                </form>

                <Alert className="mt-6 bg-blue-50 border-blue-200 text-blue-900">
                    <HelpCircle className="h-4 w-4 !text-blue-900" />
                    <AlertTitle>¿Necesitas ayuda para configurar NocoDB?</AlertTitle>
                    <AlertDescription>
                        Hemos preparado una guía detallada que te explica paso a paso cómo obtener tus credenciales y crear las tablas necesarias.
                        <Button variant="link" asChild className="p-0 h-auto ml-1 text-blue-900 font-bold">
                            <Link href="/docs/nocodb_setup.md" target="_blank">Consulta la guía de configuración aquí.</Link>
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
