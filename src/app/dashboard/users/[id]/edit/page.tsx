'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import type { User, Role, Department } from '@/lib/types';
import { roles, departments } from '@/lib/data';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      db.getUserById(userId)
        .then(data => {
          if (data) {
            setUser(data);
          } else {
            toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
            router.push('/dashboard/users');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [userId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.name || !user.email || !user.role || !user.department) {
        toast({
            title: "Error de Validación",
            description: "Por favor, completa todos los campos obligatorios.",
            variant: "destructive",
        });
        return;
    }

    try {
        await db.updateUser(userId, {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
        });
        toast({
        title: "Usuario Actualizado",
        description: "Los datos del usuario han sido guardados.",
        });
        router.push('/dashboard/users');
    } catch (error) {
        console.error("Failed to update user", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo actualizar el usuario.",
            variant: "destructive",
        })
    }
  };

  if (loading || !user) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Usuarios
            </Link>
        </Button>
      
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
            <CardHeader>
            <CardTitle>Editar Usuario</CardTitle>
            <CardDescription>Modifica los datos del miembro de la organización.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" required value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" required value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select onValueChange={(value: Role) => setUser({...user, role: value})} value={user.role}>
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Departamento</Label>
                        <Select onValueChange={(value: Department) => setUser({...user, department: value})} value={user.department}>
                            <SelectTrigger id="department">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="text-sm text-muted-foreground">
                    La contraseña no se puede cambiar desde este formulario.
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg">Guardar Cambios</Button>
                </div>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
