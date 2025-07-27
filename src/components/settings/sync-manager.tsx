
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Loader2, ServerCog } from 'lucide-react';
import { syncWithSupabase } from '@/lib/supabase-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { syncAllDataAction } from '@/app/dashboard/settings/actions';

export function SyncManager() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>(['Registro de sincronización listo.']);

    const handleSync = async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            toast({
                title: 'Sin Conexión',
                description: 'No se puede sincronizar. Por favor, revisa tu conexión a internet.',
                variant: 'destructive',
            });
            setLog(prev => [...prev, "ERROR: Intento de sincronización sin conexión a internet."]);
            return;
        }

        setIsLoading(true);
        setLog(['Iniciando sincronización con Supabase...']);
        
        try {
            const unsyncedUsers = await db.db.users.filter(user => user.isSynced === false).toArray();
            const unsyncedCourses = await db.db.courses.filter(course => course.isSynced === false).toArray();
            
            setLog(prev => [...prev, `Encontrados ${unsyncedUsers.length} usuarios y ${unsyncedCourses.length} cursos para sincronizar.`]);

            if (unsyncedUsers.length === 0 && unsyncedCourses.length === 0) {
                toast({ title: 'Todo al día', description: 'No hay datos nuevos para sincronizar.' });
                setLog(prev => [...prev, 'No hay datos nuevos para sincronizar.']);
                setIsLoading(false);
                return;
            }

            const result = await syncAllDataAction({ users: unsyncedUsers, courses: unsyncedCourses });
            
            setLog(prev => [...prev, ...result.log]);

            if (result.success) {
                toast({ title: 'Sincronización Completa', description: 'Los datos se han guardado en Supabase.' });
                
                if (result.syncedUserIds.length > 0) {
                    await db.db.users.where('id').anyOf(result.syncedUserIds).modify({ isSynced: true, updatedAt: new Date().toISOString() });
                    setLog(prev => [...prev, `Cliente: Marcados ${result.syncedUserIds.length} usuarios como sincronizados.`]);
                }
                if (result.syncedCourseIds.length > 0) {
                    await db.db.courses.where('id').anyOf(result.syncedCourseIds).modify({ isSynced: true, updatedAt: new Date().toISOString() });
                     setLog(prev => [...prev, `Cliente: Marcados ${result.syncedCourseIds.length} cursos como sincronizados.`]);
                }

            } else {
                 toast({ title: 'Error de Sincronización', description: 'Hubo un problema al contactar con Supabase.', variant: 'destructive' });
            }

        } catch (error: any) {
            console.error("Sync failed", error);
            const errorMessage = `ERROR FATAL en el cliente: ${error.message}`;
            setLog(prev => [...prev, errorMessage]);
            toast({ title: 'Error de Sincronización', description: 'Ocurrió un error inesperado en el cliente.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
            setLog(prev => [...prev, "--- Proceso finalizado ---"]);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sincronización con Supabase</CardTitle>
                <CardDescription>
                    Sincroniza los datos locales (nuevos usuarios, cursos, etc.) con la base de datos remota en Supabase.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleSync} disabled={isLoading} size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ServerCog className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Sincronizando...' : 'Iniciar Sincronización'}
                </Button>
                <div>
                    <Label htmlFor="sync-log">Registro de Sincronización</Label>
                    <ScrollArea className="h-72 w-full rounded-md border mt-2">
                        <pre id="sync-log" className="p-4 text-xs font-mono whitespace-pre-wrap">
                            {log.join('\n')}
                        </pre>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
