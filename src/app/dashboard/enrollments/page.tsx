
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';
import {
  Loader2, MoreVertical, X, Check, Search, ListFilter,
  CheckCircle2, AlertCircle, XCircle, Send, Hourglass, Trash2, CalendarX2, UserX, Star, HelpCircle
} from 'lucide-react';

import * as db from '@/lib/db';
import type { User, EnrollmentWithDetails, EnrollmentStatus, enrollmentStatuses } from '@/lib/types';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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


// --- Admin/Manager View ---

const statusUpdateSchema = z.object({
  status: z.enum(enrollmentStatuses),
  justification: z.string().optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

const statusOptions: { value: EnrollmentStatus, label: string }[] = [
    { value: 'approved', label: 'Aprobar' },
    { value: 'rejected', label: 'Rechazar' },
    { value: 'waitlisted', label: 'Poner en lista de espera' },
    { value: 'needs_review', label: 'Marcar para revisión' },
];

function UpdateStatusDialog({
  enrollment,
  open,
  onOpenChange,
  onUpdate,
}: {
  enrollment: EnrollmentWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}) {
    const { toast } = useToast();
    const form = useForm<StatusUpdateFormValues>({
        resolver: zodResolver(statusUpdateSchema),
    });

    const onSubmit = async (data: StatusUpdateFormValues) => {
        if (!enrollment?.id) return;
        try {
            await db.updateEnrollmentStatus(enrollment.id, data.status, data.justification);
            toast({ title: "Estado actualizado", description: `La inscripción de ${enrollment.userName} ahora está como '${data.status}'.` });
            onUpdate();
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
        }
    };
    
    if (!enrollment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Inscripción</DialogTitle>
                    <DialogDescription>
                        Gestionando la solicitud de <strong>{enrollment.userName}</strong> para el curso <strong>{enrollment.courseTitle}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form id="update-status-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <Controller
                        name="status"
                        control={form.control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label>Nuevo Estado</label>
                                <div className="grid grid-cols-2 gap-2">
                                {statusOptions.map(opt => (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        variant={field.value === opt.value ? 'default' : 'outline'}
                                        onClick={() => field.onChange(opt.value)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                                </div>
                            </div>
                        )}
                    />
                    <Controller
                        name="justification"
                        control={form.control}
                        render={({ field }) => (
                           <div>
                                <label>Justificación (Opcional)</label>
                               <Textarea placeholder="Ej: Aprobado por cumplir los requisitos del puesto..." {...field} />
                           </div>
                        )}
                    />
                </form>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="update-status-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Actualizar Estado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AdminEnrollmentsView() {
    const [searchTerm, setSearchTerm] = useState('');
    const allEnrollments = useLiveQuery(db.getAllEnrollmentsWithDetails, [], []);
    
    const [filters, setFilters] = useState<Record<EnrollmentStatus, boolean>>(() =>
        Object.fromEntries(enrollmentStatuses.map(s => [s, s === 'pending'])) as any
    );

    const [enrollmentToUpdate, setEnrollmentToUpdate] = useState<EnrollmentWithDetails | null>(null);

    const filteredEnrollments = useMemo(() => {
        if (!allEnrollments) return [];
        return allEnrollments.filter(e => 
            filters[e.status] &&
            (searchTerm === '' ||
             e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allEnrollments, filters, searchTerm]);
    
    if (!allEnrollments) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gestión de Inscripciones</h1>
                <p className="text-muted-foreground">Supervisa, aprueba y gestiona todas las solicitudes de inscripción de la plataforma.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por usuario o curso..."
                                className="pl-8 w-full md:w-1/3"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline"><ListFilter className="mr-2 h-4 w-4" />Filtrar por Estado</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Mostrar Estados</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {enrollmentStatuses.map(status => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={filters[status]}
                                        onCheckedChange={checked => setFilters(f => ({ ...f, [status]: !!checked }))}
                                        className="capitalize"
                                    >
                                        {status.replace('_', ' ')}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Curso</TableHead>
                                    <TableHead>Fecha Solicitud</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEnrollments.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>
                                            <div className="font-medium">{e.userName}</div>
                                            <div className="text-sm text-muted-foreground">{e.userEmail}</div>
                                        </TableCell>
                                        <TableCell>{e.courseTitle}</TableCell>
                                        <TableCell>{format(new Date(e.requestDate), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell><StatusBadge status={e.status} /></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setEnrollmentToUpdate(e)}>
                                                Gestionar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredEnrollments.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No se encontraron inscripciones con los filtros actuales.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <UpdateStatusDialog 
                enrollment={enrollmentToUpdate}
                open={!!enrollmentToUpdate}
                onOpenChange={() => setEnrollmentToUpdate(null)}
                onUpdate={() => { /* LiveQuery handles refresh */ }}
            />
        </div>
    );
}


// --- Student View ---

function StatusBadge({ status }: { status: EnrollmentStatus }) {
    const statusInfo: Record<EnrollmentStatus, { label: string; icon: LucideIcon; color: string }> = {
        pending: { label: 'Pendiente', icon: Hourglass, color: 'text-amber-600 bg-amber-100 border-amber-200' },
        approved: { label: 'Aprobada', icon: Check, color: 'text-sky-600 bg-sky-100 border-sky-200' },
        active: { label: 'En Curso', icon: Send, color: 'text-blue-600 bg-blue-100 border-blue-200' },
        completed: { label: 'Finalizado', icon: Star, color: 'text-green-600 bg-green-100 border-green-200' },
        rejected: { label: 'Rechazada', icon: XCircle, color: 'text-red-600 bg-red-100 border-red-200' },
        cancelled: { label: 'Cancelada', icon: Trash2, color: 'text-gray-600 bg-gray-100 border-gray-200' },
        waitlisted: { label: 'En Espera', icon: AlertCircle, color: 'text-orange-600 bg-orange-100 border-orange-200' },
        expelled: { label: 'Expulsado', icon: UserX, color: 'text-white bg-red-800 border-red-900' },
        expired: { label: 'Caducada', icon: CalendarX2, color: 'text-gray-600 bg-gray-100 border-gray-200' },
        needs_review: { label: 'En Revisión', icon: HelpCircle, color: 'text-purple-600 bg-purple-100 border-purple-200' },
    };

    const { label, icon: Icon, color } = statusInfo[status];
    return (
        <Badge variant="outline" className={cn("gap-1.5 capitalize", color)}>
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}

function StudentEnrollmentCard({ enrollment }: { enrollment: EnrollmentWithDetails }) {
    const { toast } = useToast();
    const [isCancelling, setIsCancelling] = useState(false);
    
    const handleCancel = async () => {
        if (!enrollment.id) return;
        setIsCancelling(true);
        try {
            await db.updateEnrollmentStatus(enrollment.id, 'cancelled', 'Cancelado por el usuario.');
            toast({ title: 'Inscripción Cancelada', description: `Has cancelado tu solicitud para ${enrollment.courseTitle}.` });
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo cancelar la inscripción.', variant: 'destructive' });
        } finally {
            setIsCancelling(false);
        }
    }
    
    const canBeCancelled = ['pending', 'waitlisted'].includes(enrollment.status);

    return (
        <Card className="flex flex-col md:flex-row gap-4 p-4">
            <Image
                src={enrollment.courseImage}
                alt={enrollment.courseTitle}
                width={160}
                height={90}
                className="rounded-lg object-cover w-full md:w-40"
            />
            <div className="flex-grow">
                <StatusBadge status={enrollment.status} />
                <h3 className="text-lg font-semibold mt-1">{enrollment.courseTitle}</h3>
                <p className="text-sm text-muted-foreground">
                    Solicitud enviada el {format(new Date(enrollment.requestDate), 'dd MMM, yyyy', { locale: es })}
                </p>
                {enrollment.justification && (
                    <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2 italic">
                        <strong>Nota del gestor:</strong> {enrollment.justification}
                    </p>
                )}
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
                <Button asChild className="w-full md:w-auto">
                    <Link href={`/dashboard/courses/${enrollment.courseId}`}>Ver Curso</Link>
                </Button>
                {canBeCancelled && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="w-full md:w-auto" disabled={isCancelling}>
                                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancelar Solicitud
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>¿Confirmar cancelación?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     Se anulará tu solicitud de inscripción para el curso "{enrollment.courseTitle}". Podrás volver a solicitarla más tarde si cambias de opinión.
                                 </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                 <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                 <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">Sí, cancelar</AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </Card>
    )
}

function StudentEnrollmentsView({ user }: { user: User }) {
    const enrollments = useLiveQuery(() => db.getEnrollmentsForStudent(user.id), [user.id]);
    
    const categorizedEnrollments = useMemo(() => {
        if (!enrollments) return { active: [], processing: [], history: [] };
        
        return {
            active: enrollments.filter(e => ['approved', 'active'].includes(e.status)),
            processing: enrollments.filter(e => ['pending', 'waitlisted', 'needs_review'].includes(e.status)),
            history: enrollments.filter(e => ['completed', 'rejected', 'cancelled', 'expelled', 'expired'].includes(e.status)),
        };
    }, [enrollments]);

     if (!enrollments) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Mis Inscripciones</h1>
                <p className="text-muted-foreground">Aquí puedes ver el estado de todas tus solicitudes de cursos.</p>
            </div>
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">En Curso ({categorizedEnrollments.active.length})</TabsTrigger>
                    <TabsTrigger value="processing">En Proceso ({categorizedEnrollments.processing.length})</TabsTrigger>
                    <TabsTrigger value="history">Historial ({categorizedEnrollments.history.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-6">
                    <div className="space-y-4">
                        {categorizedEnrollments.active.length > 0 ? (
                           categorizedEnrollments.active.map(e => <StudentEnrollmentCard key={e.id} enrollment={e} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No tienes inscripciones en cursos activos.</p>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="processing" className="mt-6">
                     <div className="space-y-4">
                        {categorizedEnrollments.processing.length > 0 ? (
                           categorizedEnrollments.processing.map(e => <StudentEnrollmentCard key={e.id} enrollment={e} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No tienes solicitudes de inscripción en proceso.</p>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                     <div className="space-y-4">
                        {categorizedEnrollments.history.length > 0 ? (
                           categorizedEnrollments.history.map(e => <StudentEnrollmentCard key={e.id} enrollment={e} />)
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Tu historial de inscripciones está vacío.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- Main Page Component ---

export default function EnrollmentsPage() {
    const { user, isLoading } = useAuth();
    
    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }
    
    const isManager = ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);
    
    return isManager ? <AdminEnrollmentsView /> : <StudentEnrollmentsView user={user} />;
}
