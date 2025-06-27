
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, FilePenLine, Trash2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, ExternalTraining, ExternalTrainingType } from '@/lib/types';
import { externalTrainingTypes } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const externalTrainingSchema = z.object({
  title: z.string().min(3, "El título es obligatorio."),
  type: z.enum(externalTrainingTypes as [string, ...string[]], { required_error: "Debes seleccionar un tipo."}),
  institution: z.string().min(2, "La entidad es obligatoria."),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fileUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  comments: z.string().optional(),
});

type ExternalTrainingFormValues = z.infer<typeof externalTrainingSchema>;

function ExternalTrainingDialog({
    open,
    onOpenChange,
    training,
    userId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    training: ExternalTraining | null;
    userId: string;
}) {
    const { toast } = useToast();
    const form = useForm<ExternalTrainingFormValues>({
        resolver: zodResolver(externalTrainingSchema),
        defaultValues: {
            title: '',
            type: undefined,
            institution: '',
            startDate: '',
            endDate: '',
            fileUrl: '',
            comments: '',
        },
    });

    useEffect(() => {
        if (training) {
            form.reset({
                title: training.title || '',
                type: training.type,
                institution: training.institution || '',
                startDate: training.startDate ? format(new Date(training.startDate), "yyyy-MM-dd") : '',
                endDate: training.endDate ? format(new Date(training.endDate), "yyyy-MM-dd") : '',
                fileUrl: training.fileUrl || '',
                comments: training.comments || '',
            });
        } else {
            form.reset({
                title: '',
                type: undefined,
                institution: '',
                startDate: '',
                endDate: '',
                fileUrl: '',
                comments: '',
            });
        }
    }, [training, form]);

    const onSubmit = async (data: ExternalTrainingFormValues) => {
        try {
            const payload: Omit<ExternalTraining, 'id'> = {
                userId,
                ...data,
                startDate: data.startDate || undefined,
                endDate: data.endDate || undefined,
            };

            if (training?.id) {
                await db.updateExternalTraining(training.id, payload);
                toast({ title: "Formación actualizada" });
            } else {
                await db.addExternalTraining(payload);
                toast({ title: "Formación añadida" });
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save external training", error);
            toast({ title: "Error", description: "No se pudo guardar la formación.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{training ? 'Editar' : 'Añadir'} Formación Externa</DialogTitle>
                </DialogHeader>
                <form id="et-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <Controller name="title" control={form.control} render={({ field }) => ( <div><Label>Título</Label><Input {...field} />{form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}</div> )} />
                    <div className="grid grid-cols-2 gap-4">
                        <Controller name="type" control={form.control} render={({ field }) => ( <div><Label>Tipo</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{externalTrainingTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>{form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}</div>)} />
                        <Controller name="institution" control={form.control} render={({ field }) => ( <div><Label>Entidad Formadora</Label><Input {...field} />{form.formState.errors.institution && <p className="text-sm text-destructive">{form.formState.errors.institution.message}</p>}</div> )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Controller name="startDate" control={form.control} render={({ field }) => ( <div><Label>Fecha Inicio</Label><Input type="date" {...field} /></div> )} />
                        <Controller name="endDate" control={form.control} render={({ field }) => ( <div><Label>Fecha Fin</Label><Input type="date" {...field} /></div> )} />
                    </div>
                     <Controller name="fileUrl" control={form.control} render={({ field }) => ( <div><Label>Enlace al Certificado (URL)</Label><Input type="url" placeholder="https://..." {...field} />{form.formState.errors.fileUrl && <p className="text-sm text-destructive">{form.formState.errors.fileUrl.message}</p>}</div> )} />
                     <Controller name="comments" control={form.control} render={({ field }) => ( <div><Label>Comentarios</Label><Textarea {...field} /></div> )} />
                </form>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="et-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ExternalTrainingSettings({ user }: { user: User }) {
    const { toast } = useToast();
    const trainings = useLiveQuery(() => db.getExternalTrainingsForUser(user.id), [user.id]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<ExternalTraining | null>(null);
    const [trainingToDelete, setTrainingToDelete] = useState<ExternalTraining | null>(null);

    const handleEdit = useCallback((training: ExternalTraining) => {
        setSelectedTraining(training);
        setIsDialogOpen(true);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!trainingToDelete?.id) return;
        try {
            await db.deleteExternalTraining(trainingToDelete.id);
            toast({ title: 'Formación eliminada' });
        } catch (error) {
            console.error("Failed to delete training", error);
            toast({ title: 'Error', description: 'No se pudo eliminar la formación.', variant: 'destructive' });
        } finally {
            setTrainingToDelete(null);
        }
    }, [trainingToDelete, toast]);

    return (
        <div className="space-y-4">
            <div className="flex flex-row items-center justify-between">
                 <div>
                    <h3 className="text-xl font-semibold">Formación Externa</h3>
                    <p className="text-sm text-muted-foreground">Registra y gestiona tus cursos y certificaciones externas.</p>
                </div>
                <Button onClick={() => { setSelectedTraining(null); setIsDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Formación
                </Button>
            </div>
            
            {trainings === undefined ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : trainings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No has registrado ninguna formación externa.</p>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Entidad</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trainings.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-medium">{t.title}</TableCell>
                                    <TableCell>{t.type}</TableCell>
                                    <TableCell>{t.institution}</TableCell>
                                    <TableCell>
                                        {t.endDate ? format(new Date(t.endDate), 'MMM yyyy') : 'En curso'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><FilePenLine className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setTrainingToDelete(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            
            <ExternalTrainingDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                training={selectedTraining}
                userId={user.id}
            />

            <AlertDialog open={!!trainingToDelete} onOpenChange={(open) => !open && setTrainingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el registro de formación externa "{trainingToDelete?.title}". Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
