
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { roles } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from '@/components/ui/skeleton';
import * as db from '@/lib/db';
import { Loader2, Server, ServerCog } from 'lucide-react';
import { useFormState } from 'react-dom';
import { saveApiKeysAction, syncAllDataAction } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';


// Helper function to convert HEX to HSL components (string "H S% L%")
function hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

// Convert HSL string from CSS to HEX for color input
function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}


function ProfileSettings({ profile, setProfile }: { profile: any, setProfile: Function }) {
    if (!profile) return <Skeleton className="h-96 w-full" />
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Gestiona tu información personal y de contacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="avatar">URL del Avatar</Label>
                    <Input id="avatar" value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={profile.role} onValueChange={(value) => setProfile({ ...profile, role: value })}>
                        <SelectTrigger id="role" className="w-full">
                            <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}

function GeneralSettings({ general, setGeneral }: { general: any, setGeneral: Function }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Configura los datos generales de la empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="orgName">Nombre de la Empresa</Label>
                    <Input id="orgName" value={general.orgName} onChange={(e) => setGeneral({ ...general, orgName: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="logo">Logo</Label>
                    <Input id="logo" type="file" />
                </div>
                 <div className="space-y-2">
                    <Label>Colores de la Marca</Label>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="primaryColor">Primario</Label>
                            <Input id="primaryColor" type="color" value={general.primaryColor} onChange={(e) => setGeneral({ ...general, primaryColor: e.target.value })} className="w-16 p-1"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="accentColor">Acento</Label>
                            <Input id="accentColor" type="color" value={general.accentColor} onChange={(e) => setGeneral({ ...general, accentColor: e.target.value })} className="w-16 p-1"/>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ApiSettings() {
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

function NotificationSettings({ notifications, setNotifications }: { notifications: any, setNotifications: Function }) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Elige cómo quieres recibir las notificaciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="course-reminders" className="font-semibold">Recordatorios de curso</Label>
                        <p className="text-sm text-muted-foreground">Recibe recordatorios para continuar con los cursos en progreso.</p>
                    </div>
                    <Switch id="course-reminders" checked={notifications.courseReminders} onCheckedChange={(checked) => setNotifications({...notifications, courseReminders: checked })} />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="new-courses" className="font-semibold">Nuevos cursos disponibles</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones cuando se publiquen nuevos cursos.</p>
                    </div>
                    <Switch id="new-courses" checked={notifications.newCourses} onCheckedChange={(checked) => setNotifications({...notifications, newCourses: checked })} />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="feedback-ready" className="font-semibold">Feedback listo</Label>
                        <p className="text-sm text-muted-foreground">Recibe un aviso cuando tu feedback de IA esté disponible.</p>
                    </div>
                    <Switch id="feedback-ready" checked={notifications.feedbackReady} onCheckedChange={(checked) => setNotifications({...notifications, feedbackReady: checked })} />
                </div>
            </CardContent>
        </Card>
    )
}

function PermissionSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Permisos</CardTitle>
                <CardDescription>Gestiona qué puede ver y hacer cada rol en la aplicación (WIP).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Esta sección está en desarrollo. En el futuro, permitirá configurar la visibilidad de menús y funcionalidades para cada rol de usuario.</p>
                 <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4">Rol: Trabajador</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="perm-worker-analytics" className="text-muted-foreground">Ver Análisis de Costes</Label>
                            <Switch id="perm-worker-analytics" disabled checked={false} />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="perm-worker-users" className="text-muted-foreground">Gestionar Usuarios</Label>
                            <Switch id="perm-worker-users" disabled checked={false} />
                        </div>
                    </div>
                </div>
                 <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4">Rol: Jefe de Formación</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="perm-manager-analytics">Ver Análisis de Costes</Label>
                            <Switch id="perm-manager-analytics" disabled checked={true} />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="perm-manager-users">Gestionar Usuarios</Label>
                            <Switch id="perm-manager-users" disabled checked={true}/>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SyncManager() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [log, setLog] = useState<string[]>(['Registro de sincronización listo.']);

    const handleSync = async () => {
        setIsLoading(true);
        setLog(['Iniciando sincronización...']);
        try {
            const unsyncedUsers = await db.users.where('isSynced').equals(false).toArray();
            const unsyncedCourses = await db.courses.where('isSynced').equals(false).toArray();

            setLog(prev => [...prev, `...Encontrados ${unsyncedUsers.length} usuarios y ${unsyncedCourses.length} cursos para sincronizar.`]);

            if (unsyncedUsers.length === 0 && unsyncedCourses.length === 0) {
                setLog(prev => [...prev, '¡Todo está al día! No hay datos nuevos para sincronizar.']);
                setIsLoading(false);
                return;
            }
            
            const result = await syncAllDataAction({
                users: unsyncedUsers,
                courses: unsyncedCourses
            });
            
            setLog(prev => [...prev, ...result.log]);

            if (result.success) {
                toast({ title: 'Sincronización Simulada Completa' });
                // In a real app, update local data after successful sync
                // await db.users.where('id').anyOf(unsyncedUsers.map(u => u.id)).modify({ isSynced: true });
                // await db.courses.where('id').anyOf(unsyncedCourses.map(c => c.id)).modify({ isSynced: true });
                setLog(prev => [...prev, 'NOTA: En una aplicación real, los elementos locales se marcarían como "sincronizados" ahora.']);
            } else {
                 toast({ title: 'Error de Sincronización', description: result.message, variant: 'destructive' });
            }

        } catch (error: any) {
            console.error("Sync failed", error);
            setLog(prev => [...prev, `ERROR FATAL: ${error.message}`]);
            toast({ title: 'Error de Sincronización', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
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

export default function SettingsPage() {
    const { toast } = useToast();
    const { user, login } = useAuth();
    
    const [profile, setProfile] = useState<any>(null);
    const [general, setGeneral] = useState({
        orgName: 'AmbuVital S.L.',
        primaryColor: '#2E9AFE',
        accentColor: '#82E0AA',
    });
    
    const [notifications, setNotifications] = useState({
        courseReminders: true,
        newCourses: true,
        feedbackReady: false,
    });
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            });
            setNotifications(user.notificationSettings || {
                courseReminders: true,
                newCourses: true,
                feedbackReady: false,
            });
        }
    }, [user]);

    useEffect(() => {
        // This effect needs to run on the client after mount.
        if (typeof window !== 'undefined') {
            const root = document.documentElement;
            // Set initial colors from CSS variables to sync state with theme
            const initialPrimary = hslToHex(
                parseFloat(getComputedStyle(root).getPropertyValue('--primary').split(' ')[0]),
                parseFloat(getComputedStyle(root).getPropertyValue('--primary').split(' ')[1]),
                parseFloat(getComputedStyle(root).getPropertyValue('--primary').split(' ')[2])
            );
            const initialAccent = hslToHex(
                 parseFloat(getComputedStyle(root).getPropertyValue('--accent').split(' ')[0]),
                 parseFloat(getComputedStyle(root).getPropertyValue('--accent').split(' ')[1]),
                 parseFloat(getComputedStyle(root).getPropertyValue('--accent').split(' ')[2])
            );
            setGeneral(g => ({...g, primaryColor: initialPrimary, accentColor: initialAccent }));
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--primary', hexToHsl(general.primaryColor));
            document.documentElement.style.setProperty('--accent', hexToHsl(general.accentColor));
        }
    }, [general.primaryColor, general.accentColor]);

    if (!user) return <p>Cargando...</p>;

    const isAdmin = user.role === 'Administrador General';

    const handleSaveChanges = async () => {
        if (!user || !profile) return;

        setIsSaving(true);
        try {
            const updatedData = {
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
                role: profile.role,
                notificationSettings: notifications,
            };

            await db.updateUser(user.id, updatedData);
            
            // Re-authenticate to fetch fresh user data and update the auth context
            if (user.password) {
              await login(profile.email, user.password);
            }

            toast({
                title: "Ajustes Guardados",
                description: "Tus cambios han sido guardados correctamente.",
            });
        } catch (error: any) {
             if (error.name === 'ConstraintError') {
                 toast({
                    title: "Error al Guardar",
                    description: "Ese correo electrónico ya está en uso por otro usuario.",
                    variant: "destructive",
                });
             } else {
                console.error("Saving settings failed", error);
                toast({
                    title: "Error",
                    description: "No se pudieron guardar los cambios.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Ajustes</h1>
                <p className="text-muted-foreground">Gestiona la configuración de la aplicación y tu perfil.</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
                 <Tabs defaultValue="profile" className="w-full">
                    <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-2'} max-w-4xl`}>
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        {isAdmin && <TabsTrigger value="general">General</TabsTrigger>}
                        <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                        {isAdmin && <TabsTrigger value="api">APIs</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="sync">Sincronización</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="permissions">Permisos</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="profile" className="mt-4">
                        <ProfileSettings profile={profile} setProfile={setProfile} />
                    </TabsContent>
                    {isAdmin && <TabsContent value="general" className="mt-4">
                        <GeneralSettings general={general} setGeneral={setGeneral} />
                    </TabsContent>}
                    <TabsContent value="notifications" className="mt-4">
                        <NotificationSettings notifications={notifications} setNotifications={setNotifications} />
                    </TabsContent>
                    {isAdmin && <TabsContent value="api" className="mt-4">
                        <ApiSettings />
                    </TabsContent>}
                    {isAdmin && <TabsContent value="sync" className="mt-4">
                        <SyncManager />
                    </TabsContent>}
                    {isAdmin && <TabsContent value="permissions" className="mt-4">
                        <PermissionSettings />
                    </TabsContent>}
                </Tabs>
            </div>
            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </div>
        </div>
    );
}
