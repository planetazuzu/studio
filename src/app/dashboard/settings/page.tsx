'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { currentUser, roles } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
    return (
         <Card>
            <CardHeader>
                <CardTitle>Credenciales de API</CardTitle>
                <CardDescription>Gestiona las claves de API para servicios externos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="aiApi">Clave API de GenAI</Label>
                    <Input id="aiApi" type="password" defaultValue="**************" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nocodbApi">Token de API NocoDB</Label>
                    <Input id="nocodbApi" type="password" defaultValue="**************" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="whatsappApi">Clave API de WhatsApp</Label>
                    <Input id="whatsappApi" type="password" defaultValue="**************" />
                </div>
            </CardContent>
        </Card>
    )
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


export default function SettingsPage() {
    const { toast } = useToast();
    const isAdmin = currentUser.role === 'Administrador General';

    const [profile, setProfile] = useState({
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
    });

    const [general, setGeneral] = useState({
        orgName: 'AmbuVital S.L.',
        primaryColor: hslToHex(207, 99, 58), // Default from CSS
        accentColor: hslToHex(145, 58, 70), // Default from CSS
    });
    
    const [notifications, setNotifications] = useState({
        courseReminders: true,
        newCourses: true,
        feedbackReady: false,
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--primary', hexToHsl(general.primaryColor));
            document.documentElement.style.setProperty('--accent', hexToHsl(general.accentColor));
        }
    }, [general.primaryColor, general.accentColor]);

    const handleSaveChanges = () => {
        // In a real app, you would save these settings to a backend.
        console.log("Saving settings:", { profile, general, notifications });
        toast({
            title: "Ajustes Guardados",
            description: "Tus cambios han sido guardados correctamente.",
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Ajustes</h1>
                <p className="text-muted-foreground">Gestiona la configuración de la aplicación y tu perfil.</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
                 <Tabs defaultValue="profile" className="w-full">
                    <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-2'} max-w-3xl`}>
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        {isAdmin && <TabsTrigger value="general">General</TabsTrigger>}
                        <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                        {isAdmin && <TabsTrigger value="api">APIs</TabsTrigger>}
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
                    {isAdmin && <TabsContent value="permissions" className="mt-4">
                        <PermissionSettings />
                    </TabsContent>}
                </Tabs>
            </div>
            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges}>Guardar Cambios</Button>
            </div>
        </div>
    );
}
