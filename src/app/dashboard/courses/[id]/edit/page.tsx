'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import type { Course } from '@/lib/types';

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

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const courseId = params.id as string;
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
          } else {
            toast({ title: "Error", description: "Curso no encontrado.", variant: "destructive" });
            router.push('/dashboard/courses');
          }
        })
    }
  }, [courseId, router, toast, form]);

  const onSubmit = async (data: CourseFormValues) => {
    try {
        await db.updateCourse(courseId, {...data, aiHint: data.title.toLowerCase().split(' ').slice(0, 2).join(' ')});
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
      
        <div className="flex justify-center">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                <CardTitle>Editar Curso</CardTitle>
                <CardDescription>Modifica la información de la formación.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del Curso</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción Corta</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="longDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción Larga</FormLabel>
                                    <FormControl><Textarea rows={5} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="instructor"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Instructor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Duración</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="modality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modalidad</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Online">Online</SelectItem>
                                                <SelectItem value="Presencial">Presencial</SelectItem>
                                                <SelectItem value="Mixta">Mixta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem><FormLabel>URL de la Imagen</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}