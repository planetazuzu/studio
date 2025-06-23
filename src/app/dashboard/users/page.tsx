'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, PlusCircle, ListFilter } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { users, roles, departments } from '@/lib/data';
import type { Role, Department, User } from '@/lib/types';
import { useAuth } from '@/contexts/auth';

const roleBadgeVariant: Record<Role, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'Administrador General': 'destructive',
    'Jefe de Formación': 'default',
    'Gestor de RRHH': 'default',
    'Formador': 'secondary',
    'Trabajador': 'outline',
    'Personal Externo': 'outline',
};

export default function UsersPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [roleFilters, setRoleFilters] = useState<Record<Role, boolean>>(() => 
        Object.fromEntries(roles.map(r => [r, true])) as Record<Role, boolean>
    );

    const [departmentFilters, setDepartmentFilters] = useState<Record<Department, boolean>>(() =>
        Object.fromEntries(departments.map(d => [d, true])) as Record<Department, boolean>
    );
    
    if (!user) return null; // Or a loader

    if (!['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role)) {
        router.push('/dashboard'); // Or show an unauthorized message
        return null;
    }

    const handleRoleFilterChange = (role: Role, checked: boolean) => {
        setRoleFilters(prev => ({ ...prev, [role]: checked }));
    };

    const handleDepartmentFilterChange = (department: Department, checked: boolean) => {
        setDepartmentFilters(prev => ({ ...prev, [department]: checked }));
    }

    const filteredUsers = users.filter(u => roleFilters[u.role] && departmentFilters[u.department]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                    Visualiza, gestiona y asigna roles a los miembros de tu organización.
                </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Usuario
                </Button>
            </div>
            
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <div>
                        <CardTitle>Usuarios</CardTitle>
                        <CardDescription>
                           Listado de todos los usuarios registrados en la plataforma.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only">Rol</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filtrar por rol</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {roles.map(role => (
                                    <DropdownMenuCheckboxItem 
                                        key={role}
                                        checked={roleFilters[role]}
                                        onCheckedChange={(checked) => handleRoleFilterChange(role, !!checked)}
                                    >
                                        {role}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only">Dept.</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filtrar por departamento</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {departments.map(dept => (
                                     <DropdownMenuCheckboxItem 
                                        key={dept}
                                        checked={departmentFilters[dept]}
                                        onCheckedChange={(checked) => handleDepartmentFilterChange(dept, !!checked)}
                                    >
                                        {dept}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>
                                <span className="sr-only">Acciones</span>
                            </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={u.avatar} alt={u.name} />
                                                <AvatarFallback>{u.name.slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                <p className="font-semibold">{u.name}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={roleBadgeVariant[u.role]}>{u.role}</Badge>
                                    </TableCell>
                                    <TableCell>{u.department}</TableCell>
                                    <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                        <DropdownMenuItem>Eliminar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
