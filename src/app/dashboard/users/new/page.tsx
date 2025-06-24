'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import type { User, Role, Department } from '@/lib/types';
import { roles, departments } from '@/lib/data';

export default function NewUserPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | undefined>();
  const [department, setDepartment] = useState<Department | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !role || !department) {
        toast({
            title: "Error de Validación",
            description: "Por favor, completa todos los campos obligatorios.",
            variant: "destructive",
        });
        return;
    }

    const newUser: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt'> = {
        name,
        email,
        password,
        role,
        department,
    };

    try {
        await db.addUser(newUser);
        toast({
        title: "Usuario Creado",
        description: "El nuevo usuario ha sido añadido a la plataforma.",
        });
        router.push('/dashboard/users');
    } catch (error) {
        console.error("Failed to create user", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo crear el usuario. Es posible que el email ya exista.",
            variant: "destructive",
        })
    }
  };

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
            <CardTitle>Crear Nuevo Usuario</CardTitle>
            <CardDescription>Completa el formulario para añadir un nuevo miembro a la organización.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" placeholder="Ej: Juan Pérez" required value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" placeholder="juan.perez@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" placeholder="Establece una contraseña segura" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select onValueChange={(value: Role) => setRole(value)} value={role}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="department">Departamento</Label>
                        <Select onValueChange={(value: Department) => setDepartment(value)} value={department}>
                            <SelectTrigger id="department">
                                <SelectValue placeholder="Selecciona un departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg">Guardar Usuario</Button>
                </div>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
