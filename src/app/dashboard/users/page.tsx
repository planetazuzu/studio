'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, ListFilter, Loader2, Trash2, FilePenLine, Upload, MessageSquare, BrainCircuit, Bot } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { roles, departments } from '@/lib/data';
import * as db from '@/lib/db';
import type { Role, Department, User, PredictAbandonmentOutput } from '@/lib/types';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { predictAbandonment } from '@/ai/flows/predict-abandonment';


const roleBadgeVariant: Record<Role, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'Administrador General': 'destructive',
    'Jefe de Formación': 'default',
    'Gestor de RRHH': 'default',
    'Formador': 'secondary',
    'Trabajador': 'outline',
    'Personal Externo': 'outline',
};

export default function UsersPage() {
    const { user: authUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const users = useLiveQuery(db.getAllUsers, []);
    
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [predictionLoading, setPredictionLoading] = useState<string | null>(null); // user.id
    const [predictionResult, setPredictionResult] = useState<Record<string, PredictAbandonmentOutput | null>>({});

    const [roleFilters, setRoleFilters] = useState<Record<Role, boolean>>(() => 
        Object.fromEntries(roles.map(r => [r, true])) as Record<Role, boolean>
    );

    const [departmentFilters, setDepartmentFilters] = useState<Record<Department, boolean>>(() =>
        Object.fromEntries(departments.map(d => [d, true])) as Record<Department, boolean>
    );
    
    if (!authUser) return null; // Or a loader

    if (!['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(authUser.role)) {
        router.push('/dashboard'); // Or show an unauthorized message
        return null;
    }

    const handleRoleFilterChange = (role: Role, checked: boolean) => {
        setRoleFilters(prev => ({ ...prev, [role]: checked }));
    };

    const handleDepartmentFilterChange = (department: Department, checked: boolean) => {
        setDepartmentFilters(prev => ({ ...prev, [department]: checked }));
    }

    const handleStartChat = async (targetUser: User) => {
        if (!authUser || authUser.id === targetUser.id) return;
        
        try {
            const channel = await db.getOrCreateDirectMessageThread(authUser.id, targetUser.id);
            router.push(`/dashboard/chat?channelId=${channel.id}`);
        } catch(error) {
            console.error("Failed to start chat", error);
            toast({
                title: "Error",
                description: "No se pudo iniciar el chat.",
                variant: "destructive"
            });
        }
    }

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        if (userToDelete.id === authUser.id) {
            toast({ title: "Error", description: "No puedes eliminar tu propia cuenta.", variant: "destructive"});
            setUserToDelete(null);
            return;
        }

        try {
            await db.deleteUser(userToDelete.id);
            toast({ title: "Usuario Eliminado", description: `El usuario ${userToDelete.name} ha sido eliminado.` });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar al usuario.", variant: "destructive" });
        } finally {
            setUserToDelete(null);
        }
    }
    
    const handlePredictAbandonment = async (user: User) => {
        if (predictionLoading === user.id) return;
        
        setPredictionLoading(user.id);
        setPredictionResult(prev => ({...prev, [user.id]: null}));

        try {
            // NOTE: In a real-world scenario, this data would be dynamically calculated from the DB.
            // For this demonstration, we are simulating varied data to showcase the AI feature.
            const simulatedData = {
                userName: user.name,
                lastLogin: "hace 2 semanas",
                activeCoursesCount: (user.name.length % 3) + 1, // 1 to 3
                completedCoursesCount: (user.name.length % 5), // 0 to 4
                averageProgress: (user.email.length * 2) % 100, // 0 to 99
            };

            const result = await predictAbandonment(simulatedData);
            setPredictionResult(prev => ({...prev, [user.id]: result}));

        } catch (error) {
            console.error("Failed to get prediction", error);
            toast({
                title: "Error de IA",
                description: "No se pudo obtener la predicción.",
                variant: "destructive",
            });
        } finally {
            setPredictionLoading(null);
        }
    }


    const filteredUsers = users ? users.filter(u => roleFilters[u.role] && departmentFilters[u.department]) : [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                    Visualiza, gestiona y asigna roles a los miembros de tu organización.
                </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/users/bulk-import">
                            <Upload className="mr-2 h-4 w-4" />
                            Importar
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/users/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Usuario
                        </Link>
                    </Button>
                </div>
            </div>
            
            <AlertDialog onOpenChange={(open) => !open && setUserToDelete(null)}>
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
                        {!users ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="ml-4 text-muted-foreground">Cargando usuarios...</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Departamento</TableHead>
                                    <TableHead>Riesgo Abandono</TableHead>
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
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => handlePredictAbandonment(u)} disabled={predictionLoading === u.id}>
                                                        {predictionLoading === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                                                        <span className="ml-2 hidden sm:inline">Analizar</span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    {predictionLoading === u.id ? (
                                                        <div className="flex items-center justify-center p-4">
                                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                        </div>
                                                    ) : predictionResult[u.id] ? (
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none flex items-center gap-2">
                                                                    <Bot /> Predicción de Riesgo
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Análisis para <span className="font-semibold">{u.name}</span>.
                                                                </p>
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-medium">Nivel de Riesgo:</span>
                                                                    <Badge variant={predictionResult[u.id]!.riskLevel === 'Alto' ? 'destructive' : predictionResult[u.id]!.riskLevel === 'Medio' ? 'secondary' : 'default'}>
                                                                        {predictionResult[u.id]!.riskLevel}
                                                                    </Badge>
                                                                </div>
                                                                 <div className="text-sm">
                                                                    <p className="font-medium">Justificación:</p>
                                                                    <p className="text-muted-foreground">{predictionResult[u.id]!.justification}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-sm text-muted-foreground p-4">Haz clic en "Analizar" para obtener una predicción de la IA.</p>
                                                    )}
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
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
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/users/${u.id}/edit`}>
                                                        <FilePenLine className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleStartChat(u)} disabled={authUser.id === u.id}>
                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                    Enviar Mensaje
                                                </DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={() => setUserToDelete(u)} className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={authUser.id === u.id}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario <span className="font-bold">{userToDelete?.name}</span> y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
