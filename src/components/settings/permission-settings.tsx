
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function PermissionSettings() {
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
