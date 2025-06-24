
'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Trash2, Loader2, Megaphone, AlertTriangle, Info, Wrench, ChevronDown, Check as CheckIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { generateAnnouncementEmail } from '@/ai/flows/announcement-email-generation';

import * as db from '@/lib/db';
import type { Announcement, AnnouncementType } from '@/lib/types';
import { announcementTypes } from '@/lib/types';
import { announcementChannels } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const announcementSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  content: z.string().min(10, { message: "El contenido debe tener al menos 10 caracteres." }),
  type: z.enum(announcementTypes as [string, ...string[]], { errorMap: () => ({ message: "Debes seleccionar un tipo." }) }),
  channels: z.array(z.string()).min(1, "Debes seleccionar al menos un canal de distribución."),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const announcementTemplates = [
  {
    name: 'Nuevo Curso',
    type: 'Informativo' as const,
    title: '¡Nuevo Curso Disponible!: [Nombre del Curso]',
    content: "Nos complace anunciar que un nuevo curso, '[Nombre del Curso]', ya está disponible en el catálogo de formación.\n\nEste curso cubre [Breve descripción del curso].\n\nInscríbete ahora desde la sección de 'Cursos'. ¡No pierdas la oportunidad de ampliar tus competencias!",
  },
  {
    name: 'Mantenimiento Programado',
    type: 'Mantenimiento' as const,
    title: 'Aviso de Mantenimiento Programado',
    content: 'Se informa que la plataforma estará en mantenimiento el día [Fecha] a las [Hora]. Durante este tiempo, el acceso podría ser intermitente.\n\nAgradecemos su comprensión.',
  },
  {
    name: 'Recordatorio Urgente',
    type: 'Urgente' as const,
    title: 'URGENTE: Recordatorio de [Asunto]',
    content: 'Este es un recordatorio urgente sobre [Asunto]. Es imperativo que todo el personal [Acción requerida] antes del [Fecha Límite].\n\nGracias por su cooperación.',
  }
];


function AddAnnouncementDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const form = useForm<AnnouncementFormValues>({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            title: '',
            content: '',
            channels: [],
        }
    });

    const { isSubmitting } = form.formState;

    const handleSelectTemplate = (template: typeof announcementTemplates[0]) => {
        form.setValue('title', template.title, { shouldDirty: true });
        form.setValue('content', template.content, { shouldDirty: true });
        form.setValue('type', template.type, { shouldDirty: true });
    };

    const onSubmit = async (data: AnnouncementFormValues) => {
        try {
            await db.addAnnouncement({
                ...data,
                timestamp: new Date().toISOString(),
            });
            toast({ title: 'Éxito', description: 'El aviso ha sido creado.' });
            
            // --- AI Email Generation ---
            // In a real app, this would be a background job. For this demo, we do it client-side.
            (async () => {
                try {
                    const allUsers = await db.getAllUsers();
                    const targetUsers = allUsers.filter(user => 
                        data.channels.includes('Todos') ||
                        data.channels.includes(user.role) ||
                        data.channels.includes(user.department)
                    );
                    
                    if (targetUsers.length > 0) {
                        toast({ title: 'IA en progreso', description: `Generando ${targetUsers.length} emails. Revisa la consola.` });
                        console.log(`[AI] Generating emails for ${targetUsers.length} users based on announcement...`);

                        for (const user of targetUsers) {
                            generateAnnouncementEmail({
                                recipientName: user.name,
                                announcementTitle: data.title,
                                announcementContent: data.content,
                            }).then(emailContent => {
                                console.log(`--- Email for ${user.email} ---`);
                                console.log(`Subject: ${emailContent.subject}`);
                                console.log(`Body:\n${emailContent.body}`);
                                console.log(`---------------------------------`);
                            }).catch(e => console.error(`Failed to generate email for ${user.name}`, e));
                        }
                    }
                } catch (e) {
                     console.error("Error during email generation process:", e);
                     toast({ title: 'Error de IA', description: 'No se pudieron generar los emails.', variant: 'destructive' });
                }
            })();
            // --- End AI Email Generation ---

            form.reset();
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'No se pudo crear el aviso.', variant: 'destructive' });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) form.reset(); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle>Crear Nuevo Aviso</DialogTitle>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Usar Plantilla
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Seleccionar Plantilla</DropdownMenuLabel>
                                {announcementTemplates.map(template => (
                                    <DropdownMenuItem key={template.name} onSelect={() => handleSelectTemplate(template)}>
                                        {template.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </DialogHeader>
                <Form {...form}>
                    <form id="announcement-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Contenido</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{announcementTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField
                                control={form.control}
                                name="channels"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Canales de Distribución</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                                                        {field.value?.length ? `${field.value.length} seleccionado(s)` : "Seleccionar canales"}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                               <ScrollArea className="h-64">
                                                <div className="p-2 space-y-1">
                                                {announcementChannels.map((channel) => (
                                                    <div key={channel} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                                                        <Checkbox
                                                            id={channel}
                                                            checked={field.value?.includes(channel)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), channel])
                                                                    : field.onChange(field.value?.filter((value) => value !== channel))
                                                            }}
                                                        />
                                                        <label htmlFor={channel} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {channel}
                                                        </label>
                                                    </div>
                                                ))}
                                                </div>
                                               </ScrollArea>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </form>
                </Form>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="announcement-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publicar Aviso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function CommunicationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const announcements = useLiveQuery(() => db.getAllAnnouncements(), []);
    const [itemToDelete, setItemToDelete] = useState<Announcement | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const announcementIcons: Record<AnnouncementType, React.ElementType> = {
        'Urgente': AlertTriangle,
        'Informativo': Info,
        'Mantenimiento': Wrench,
    };
    
    if (!user || !['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role)) {
        router.push('/dashboard');
        return null;
    }

    const handleDelete = async () => {
        if (!itemToDelete?.id) return;
        try {
            await db.deleteAnnouncement(itemToDelete.id);
            toast({ title: 'Éxito', description: 'El aviso ha sido eliminado.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'No se pudo eliminar el aviso.', variant: 'destructive' });
        } finally {
            setItemToDelete(null);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold">Gestión de Avisos</h1>
                <p className="text-muted-foreground">Crea y gestiona las comunicaciones para la organización.</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Aviso
                </Button>
            </div>

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <Card>
                <CardHeader>
                    <CardTitle>Historial de Avisos</CardTitle>
                    <CardDescription>Lista de todas las comunicaciones enviadas.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!announcements ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Megaphone className="mx-auto h-12 w-12" />
                            <p className="mt-4 font-semibold">No hay avisos todavía.</p>
                            <p className="text-sm">Crea el primer aviso para comunicarte con tu equipo.</p>
                        </div>
                    ) : (
                    <div className="border rounded-lg">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Canales</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {announcements.map((item) => {
                            const Icon = announcementIcons[item.type];
                            return (
                                <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell>
                                    <Badge variant={item.type === 'Urgente' ? 'destructive' : 'secondary'}>
                                        <Icon className="mr-1 h-3 w-3" />
                                        {item.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {item.channels.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(item.timestamp), 'd MMM, yyyy', { locale: es })}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            );
                            })}
                        </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
                </Card>
                
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Seguro que quieres eliminar este aviso?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta acción no se puede deshacer. El aviso "{itemToDelete?.title}" se eliminará permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AddAnnouncementDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        </div>
    );
}
