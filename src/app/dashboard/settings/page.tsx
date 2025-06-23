import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

function ProfileSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Gestiona tu información personal y de contacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" defaultValue="Elena Vargas" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" defaultValue="elena.vargas@example.com" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="avatar">URL del Avatar</Label>
                    <Input id="avatar" defaultValue="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                </div>
            </CardContent>
        </Card>
    );
}

function GeneralSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Configura los datos generales de la empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="orgName">Nombre de la Empresa</Label>
                    <Input id="orgName" defaultValue="AmbuVital S.L." />
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
                            <Input id="primaryColor" type="color" defaultValue="#2E9AFE" className="w-16 p-1"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="accentColor">Acento</Label>
                            <Input id="accentColor" type="color" defaultValue="#82E0AA" className="w-16 p-1"/>
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

function NotificationSettings() {
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
                    <Switch id="course-reminders" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="new-courses" className="font-semibold">Nuevos cursos disponibles</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones cuando se publiquen nuevos cursos.</p>
                    </div>
                    <Switch id="new-courses" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <Label htmlFor="feedback-ready" className="font-semibold">Feedback listo</Label>
                        <p className="text-sm text-muted-foreground">Recibe un aviso cuando tu feedback de IA esté disponible.</p>
                    </div>
                    <Switch id="feedback-ready" />
                </div>
            </CardContent>
        </Card>
    )
}


export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground">Gestiona la configuración de la aplicación y tu perfil.</p>
      </div>
      <div className="grid grid-cols-1 gap-8">
         <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                <TabsTrigger value="api">APIs</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-4">
                <ProfileSettings />
            </TabsContent>
            <TabsContent value="general" className="mt-4">
                <GeneralSettings />
            </TabsContent>
            <TabsContent value="notifications" className="mt-4">
                <NotificationSettings />
            </TabsContent>
            <TabsContent value="api" className="mt-4">
                <ApiSettings />
            </TabsContent>
        </Tabs>
      </div>
       <div className="flex justify-end">
            <Button size="lg">Guardar Cambios</Button>
        </div>
    </div>
  );
}
