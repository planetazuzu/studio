
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import { Loader2, ServerCog } from 'lucide-react';
import { syncAllDataAction } from '@/app/dashboard/settings/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        setLog(['Iniciando sincronización desde el cliente...']);
        
        try {
            // 1. Get unsynced data from client-side Dexie
            // Switched from .where().equals() to .filter() to avoid potential indexing issues
            // with boolean values, which was causing a crash. This is safer.
            const unsyncedUsers = await db.db.users.filter(user => user.isSynced === false).toArray();
            const unsyncedCourses = await db.db.courses.filter(course => course.isSynced === false).toArray();
            
            setLog(prev => [...prev, `Encontrados ${unsyncedUsers.length} usuarios y ${unsyncedCourses.length} cursos para sincronizar.`]);

            // 2. Call server action with the data
            const result = await syncAllDataAction({ users: unsyncedUsers, courses: unsyncedCourses });
            
            // Append server logs to client log
            setLog(prev => [...prev, ...result.log]);

            if (result.success) {
                toast({ title: 'Sincronización Completa', description: result.message });
                
                // 3. Mark synced items in local Dexie
                if (result.syncedIds.users.length > 0) {
                    await db.db.users.where('id').anyOf(result.syncedIds.users).modify({ isSynced: true });
                     setLog(prev => [...prev, `Cliente: Marcados ${result.syncedIds.users.length} usuarios como sincronizados.`]);
                }
                if (result.syncedIds.courses.length > 0) {
                    await db.db.courses.where('id').anyOf(result.syncedIds.courses).modify({ isSynced: true });
                    setLog(prev => [...prev, `Cliente: Marcados ${result.syncedIds.courses.length} cursos como sincronizados.`]);
                }

            } else {
                 toast({ title: 'Error de Sincronización', description: result.message, variant: 'destructive' });
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
                <CardTitle>Sincronización con NocoDB</CardTitle>
                <CardDescription>
                    Sincroniza los datos locales (nuevos usuarios, cursos modificados, etc.) con la base de datos remota de NocoDB.
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
