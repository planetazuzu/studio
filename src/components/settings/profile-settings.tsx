
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { roles } from '@/lib/data';

export function ProfileSettings({ profile, setProfile }: { profile: any, setProfile: Function }) {
    if (!profile) return <Skeleton className="h-96 w-full" />
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Gestiona tu información personal y de contacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono (para WhatsApp)</Label>
                        <Input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+34123456789" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="avatar">URL del Avatar</Label>
                    <Input id="avatar" value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="role">Rol (No editable)</Label>
                    <Input id="role" value={profile.role} disabled />
                </div>
                <div className="space-y-2">
                    <Label>Puntos de Experiencia</Label>
                    <Input value={profile.points} disabled />
                </div>
            </CardContent>
        </Card>
    );
}
