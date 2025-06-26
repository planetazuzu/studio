
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GeneralSettings({ general, setGeneral }: { general: any, setGeneral: Function }) {
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
