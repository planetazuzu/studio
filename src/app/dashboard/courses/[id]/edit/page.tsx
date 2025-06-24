
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import type { Course, Module } from '@/lib/types';

const courseFormSchema = z.object({
  title: z.string().min(2, { message: "El título debe tener al menos 2 caracteres." }),
  description: z.string().min(10, { message: "La descripción corta debe tener al menos 10 caracteres." }),
  longDescription: z.string().min(20, { message: "La descripción larga debe tener al menos 20 caracteres." }),
  instructor: z.string().min(2, { message: "El nombre del instructor debe tener al menos 2 caracteres." }),
  duration: z.string().min(1, { message: "La duración es obligatoria." }),
  modality: z.enum(['Online', 'Presencial', 'Mixta'], { errorMap: () => ({ message: "Debes seleccionar una modalidad." }) }),
  image: z.string().url({ message: "Debe ser una URL válida." }),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// --- Module Dialog Component ---
function ModuleDialog({
  open,
  onOpenChange,
  onSave,
  module,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Module, 'id'>) => void;
  module: Omit<Module, 'id'> | Module | null;
}) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDuration(module.duration);
      setContent(module.content);
    } else {
      setTitle('');
      setDuration('');
      setContent('');
    }
  }, [module]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration || !content) return;
    onSave({ title, duration, content });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{module ? 'Editar Módulo' : 'Añadir Nuevo Módulo'}</DialogTitle>
        </DialogHeader>
        <form id="module-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="module-title">Título del Módulo</Label>
            <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-duration">Duración</Label>
            <Input id="module-duration" value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-content">Contenido</Label>
            <Textarea id="module-content" value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
          <Button type="submit" form="module-form">Guardar Módulo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const courseId = params.id as string;
  
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesDirty, setModulesDirty] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
        title: '',
        description: '',
        longDescription: '',
        instructor: '',
        duration: '',
        modality: undefined,
        image: ''
    }
  });
  
  const { isSubmitting, isDirty, isLoading } = form.formState;

  useEffect(() => {
    if (courseId) {
      db.getCourseById(courseId)
        .then(data => {
          if (data) {
            form.reset(data);
            setModules(data.modules || []);
          } else {
            toast({ title: "Error", description: "Curso no encontrado.", variant: "destructive" });
            router.push('/dashboard/courses');
          }
        })
    }
  }, [courseId, router, toast, form]);

  const onSubmit = async (data: CourseFormValues) => {
    try {
        const courseData = {
          ...data,
          modules: modules, // Include the modules in the save data
          aiHint: data.title.toLowerCase().split(' ').slice(0, 2).join(' ')
        };
        await db.updateCourse(courseId, courseData);
        toast({
            title: "Curso Actualizado",
            description: "Los datos del curso han sido guardados.",
        });
        router.push('/dashboard/courses');
    } catch (error) {
        console.error("Failed to update course", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo actualizar el curso.",
            variant: "destructive",
        });
    }
  };

  const handleSaveModule = (moduleData: Omit<Module, 'id'>) => {
    if (currentModule) {
      setModules(modules.map(m => m.id === currentModule.id ? { ...currentModule, ...moduleData } : m));
    } else {
      const newModule: Module = { id: `mod_${Date.now()}`, ...moduleData };
      setModules([...modules, newModule]);
    }
    setModulesDirty(true);
    setIsModuleDialogOpen(false);
    setCurrentModule(null);
  };

  const handleOpenModuleDialog = (module: Module | null) => {
    setCurrentModule(module);
    setIsModuleDialogOpen(true);
  };

  const handleDeleteModule = () => {
    if (moduleToDelete) {
      setModules(modules.filter(m => m.id !== moduleToDelete.id));
      setModulesDirty(true);
      setModuleToDelete(null);
    }
  };


  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Catálogo
            </Link>
        </Button>
      
        <div className="space-y-8">
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                <CardTitle>Editar Curso</CardTitle>
                <CardDescription>Modifica la información general de la formación.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Título del Curso</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción Corta</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="longDescription" render={({ field }) => (<FormItem><FormLabel>Descripción Larga</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="instructor" render={({ field }) => (<FormItem><FormLabel>Instructor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duración</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="modality" render={({ field }) => (<FormItem><FormLabel>Modalidad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Online">Online</SelectItem><SelectItem value="Presencial">Presencial</SelectItem><SelectItem value="Mixta">Mixta</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="image" render={({ field }) => (<FormItem><FormLabel>URL de la Imagen</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        {/* The submit button is moved to the bottom of the page */}
                    </form>
                </Form>
                </CardContent>
            </Card>

            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Módulos del Curso</CardTitle>
                            <CardDescription>Añade y gestiona el contenido del curso.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleOpenModuleDialog(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Módulo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {modules.length > 0 ? (
                            modules.map(module => (
                                <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-semibold">{module.title}</p>
                                        <p className="text-sm text-muted-foreground">{module.duration}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModuleDialog(module)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setModuleToDelete(module)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-4">Este curso todavía no tiene módulos.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4 max-w-3xl mx-auto">
                <Button type="button" onClick={form.handleSubmit(onSubmit)} size="lg" disabled={isSubmitting || (!isDirty && !modulesDirty)}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </div>
        </div>

        <ModuleDialog
            open={isModuleDialogOpen}
            onOpenChange={setIsModuleDialogOpen}
            onSave={handleSaveModule}
            module={currentModule}
        />
        
        <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Seguro que quieres eliminar este módulo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el módulo "{moduleToDelete?.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModuleToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

