
'use client';

import { useEffect, useRef, useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveApiKeysAction } from '@/app/dashboard/settings/actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Server } from 'lucide-react';


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
            if (state.success) {
                formRef.current?.reset();
            }
        }
    }, [state, toast]);

    return (
         <Card>
            <CardHeader>
                <CardTitle>Configuración de APIs</CardTitle>
                <CardDescription>Gestiona las claves y URLs para servicios externos. Se guardan de forma segura como cookies de servidor.</CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={formAction} className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">GenAI (Google)</h3>
                         <div className="space-y-2">
                            <Label htmlFor="genaiApiKey">Clave API de GenAI</Label>
                            <Input id="genaiApiKey" name="genaiApiKey" type="password" placeholder="Introduce o actualiza la clave API" />
                            <p className="text-xs text-muted-foreground">Deja el campo en blanco y guarda para eliminar la clave actual.</p>
                        </div>
                    </div>
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-2">NocoDB (Base de Datos Remota)</h3>
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
                    <div className="flex justify-end">
                        <Button type="submit">Guardar Configuración de APIs</Button>
                    </div>
                </form>
                 <Alert className="mt-6">
                    <Server className="h-4 w-4" />
                    <AlertTitle>¿Qué es NocoDB?</AlertTitle>
                    <AlertDescription>
                        NocoDB es una alternativa de código abierto a Airtable. Nos permite crear una base de datos con una API REST lista para usar, ideal para sincronizar los datos de esta aplicación.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
