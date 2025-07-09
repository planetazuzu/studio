'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, ListFilter, Loader2, Trash2, FilePenLine, Upload, BrainCircuit, Bot, Check, X, Hourglass } from 'lucide-react';
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
import type { Role, Department, User, PredictAbandonmentOutput, AIConfig, UserStatus } from '@/lib/types';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { predictAbandonment } from '@/ai/flows/predict-abandonment';
import { Switch } from '@/components/ui/switch';


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
    const aiConfig = useLiveQuery<AIConfig | undefined>(() => db.getAIConfig());
    
    const [action, setAction] = useState<{ type: 'approve' | 'reject' | 'delete', user: User } | null>(null);
    const [predictionLoading, setPredictionLoading] = useState<string | null>(null); // user.id
    const [predictionResult, setPredictionResult] = useState<Record<string, PredictAbandonmentOutput | null>>({});

    const [roleFilters, setRoleFilters] = useState<Record<Role, boolean>>(() => 
        Object.fromEntries(roles.map(r => [r, true])) as Record<Role, boolean>
    );

    const [departmentFilters, setDepartmentFilters] = useState<Record<Department, boolean>>(() =>
        Object.fromEntries(departments.map(d => [d, true])) as Record<Department, boolean>
    );
    
    if (!authUser) return null;

    if (!['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(authUser.role)) {
        router.push('/dashboard');
        return null;
    }

    const { pendingUsers, filteredActiveUsers } = useMemo(() => {
        if (!users) return { pendingUsers: [], filteredActiveUsers: [] };
        
        const pending = users.filter(u => u.status === 'pending_approval');
        const active = users.filter(u => u.status !== 'pending_approval');
        
        const filteredActive = active.filter(u => roleFilters[u.role] && departmentFilters[u.department]);

        return { pendingUsers, filteredActiveUsers };
    }, [users, roleFilters, departmentFilters]);

    const handleRoleFilterChange = (role: Role, checked: boolean) => {
        setRoleFilters(prev => ({ ...prev, [role]: checked }));
    };

    const handleDepartmentFilterChange = (department: Department, checked: boolean) => {
        setDepartmentFilters(prev => ({ ...prev, [department]: checked }));
    }

    const handleConfirmAction = async () => {
        if (!action) return;
        const { type, user } = action;

        if (type === 'delete' && user.id === authUser.id) {
            toast({ title: "Error", description: "No puedes eliminar tu propia cuenta.", variant: "destructive"});
            setAction(null);
            return;
        }

        try {
            if (type === 'approve') {
                await db.updateUserStatus(user.id, 'approved');
                toast({ title: "Usuario Aprobado", description: `El usuario ${user.name} ha sido activado.` });
            } else if (type === 'reject' || type === 'delete') {
                await db.deleteUser(user.id);
                const toastTitle = type === 'reject' ? "Solicitud Rechazada" : "Usuario Eliminado";
                const toastDesc = type === 'reject' 
                    ? `La solicitud de ${user.name} ha sido rechazada y eliminada.`
                    : `El usuario ${user.name} ha sido eliminado.`;
                toast({ title: toastTitle, description: toastDesc });
            }
        } catch (error) {
            toast({ title: "Error", description: "La operación no pudo completarse.", variant: "destructive" });
        } finally {
            setAction(null);
        }
    };
    
    const getDialogContent = () => {
        if (!action) return null;
        const { type, user } = action;
        
        const contentMap = {
            approve: {
                title: '¿Aprobar este usuario?',
                description: `El usuario ${user.name} (${user.email}) obtendrá acceso a la plataforma con el rol de ${user.role}.`,
                actionText: 'Aprobar',
                actionClass: ''
            },
            reject: {
                title: '¿Rechazar esta solicitud?',
                description: `Se eliminará permanentemente la solicitud del usuario ${user.name}.`,
                actionText: 'Rechazar y Eliminar',
                actionClass: 'bg-destructive hover:bg-destructive/90'
            },
            delete: {
                title: '¿Estás realmente seguro?',
                description: `Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario ${user.name} y todos sus datos asociados.`,
                actionText: 'Eliminar Usuario',
                actionClass: 'bg-destructive hover:bg-destructive/90'
            }
        };
        return contentMap[type];
    };

    const dialogContent = getDialogContent();

    
    const handlePredictAbandonment = async (user: User) => {
        if (predictionLoading === user.id) return;
        
        setPredictionLoading(user.id);
        setPredictionResult(prev => ({...prev, [user.id]: null}));

        try {
            const simulatedData = {
                userName: user.name,
                lastLogin: "hace 2 semanas",
                activeCoursesCount: (user.name.length % 3) + 1,
                completedCoursesCount: (user.name.length % 5),
                averageProgress: (user.email.length * 2) % 100,
            };

            const result = await predictAbandonment(simulatedData);
            setPredictionResult(prev => ({...prev, [user.id]: result}));

        } catch (error: any) {
            console.error("Failed to get prediction", error);
            const description = error.message?.includes('API no está configurada')
                ? error.message
                : "No se pudo obtener la predicción.";
            toast({
                title: "Error de IA",
                description,
                variant: "destructive",
            });
        } finally {
            setPredictionLoading(null);
        }
    }
    
    const handleStatusToggle = async (userId: string, newStatus: boolean) => {
        try {
            const status: UserStatus = newStatus ? 'approved' : 'suspended';
            await db.updateUserStatus(userId, status);
            toast({
                title: "Estado actualizado",
                description: "El estado del usuario ha sido cambiado."
            });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cambiar el estado del usuario.", variant: "destructive" });
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                    Visualiza y gestiona a los miembros de tu organización.
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
            
             {pendingUsers.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Hourglass/> Solicitudes Pendientes</CardTitle>
                        <CardDescription>Estos usuarios se han registrado con roles que requieren aprobación manual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol Solicitado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingUsers.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3 group">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={u.avatar} alt={u.name} />
                                                    <AvatarFallback>{u.name?.slice(0, 2) ?? '?'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{u.name || u.email}</p>
                                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {u.role ? <Badge variant={roleBadgeVariant[u.role]}>{u.role}</Badge> : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" onClick={() => setAction({ type: 'approve', user: u })}><Check className="mr-2 h-4 w-4"/>Aprobar</Button>
                                                <Button size="sm" variant="destructive" onClick={() => setAction({ type: 'reject', user: u })}><X className="mr-2 h-4 w-4"/>Rechazar</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            <AlertDialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Usuarios Registrados</CardTitle>
                                <CardDescription>
                                    Un total de {filteredActiveUsers?.length || 0} usuarios activos en la plataforma.
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
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!users ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Departamento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    {aiConfig?.enabledFeatures.abandonmentPrediction && <TableHead>Riesgo Abandono</TableHead>}
                                    <TableHead>
                                        <span className="sr-only">Acciones</span>
                                    </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActiveUsers.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/dashboard/users/${u.id}`} className="flex items-center gap-3 group">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={u.avatar} alt={u.name} />
                                                        <AvatarFallback>{u.name?.slice(0, 2) ?? '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="grid gap-0.5">
                                                        <p className="font-semibold group-hover:underline">{u.name || u.email}</p>
                                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {u.role ? <Badge variant={roleBadgeVariant[u.role]}>{u.role}</Badge> : '-'}
                                            </TableCell>
                                            <TableCell>{u.department || '-'}</TableCell>
                                             <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`status-${u.id}`}
                                                        checked={u.status === 'approved'}
                                                        onCheckedChange={(checked) => handleStatusToggle(u.id, checked)}
                                                        disabled={authUser.id === u.id}
                                                    />
                                                    <Badge variant={u.status === 'approved' ? 'default' : 'secondary'}>
                                                        {u.status === 'approved' ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            {aiConfig?.enabledFeatures.abandonmentPrediction && (
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
                                            )}
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
                                                <DropdownMenuItem onSelect={() => setAction({ type: 'delete', user: u })} className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={authUser.id === u.id}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
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
                
                {dialogContent && (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setAction(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmAction} className={dialogContent.actionClass}>
                                {dialogContent.actionText}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                )}
            </AlertDialog>
        </div>
    );
}
