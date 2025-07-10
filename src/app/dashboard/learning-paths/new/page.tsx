'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Loader2, Check, ChevronsUpDown, GripVertical, X } from 'lucide-react';
import * as db from '@/lib/db';
import { roles } from '@/lib/data';
import type { Course, Role } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const pathSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción es muy corta."),
  targetRole: z.enum(roles as [string, ...string[]], { required_error: "Debes seleccionar un rol." }),
});

type PathFormValues = z.infer<typeof pathSchema>;

export default function NewLearningPathPage() {
  const router = useRouter();
  const { toast } = useToast();
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);

  const form = useForm<PathFormValues>({
    resolver: zodResolver(pathSchema),
    defaultValues: { title: '', description: '' },
  });

  const handleSelectCourse = (course: Course) => {
    setSelectedCourses(prev => {
      if (prev.find(c => c.id === course.id)) {
        return prev.filter(c => c.id !== course.id); // Deselect
      } else {
        return [...prev, course]; // Select
      }
    });
    setOpen(false);
  };

  const onSubmit = async (data: PathFormValues) => {
    if (selectedCourses.length === 0) {
      toast({ title: 'Error', description: 'Debes seleccionar al menos un curso.', variant: 'destructive' });
      return;
    }
    try {
      await db.addLearningPath({
        ...data,
        courseIds: selectedCourses.map(c => c.id),
      });
      toast({ title: 'Plan de Carrera Creado', description: 'El nuevo plan ha sido guardado.' });
      router.push('/dashboard/learning-paths');
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo crear el plan.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/learning-paths">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Planes de Carrera
        </Link>
      </Button>

      <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Nuevo Plan de Carrera</CardTitle>
            <CardDescription>Define una secuencia de cursos para un rol específico.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Título del Plan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="targetRole" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol de Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un rol..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div>
                  <Label>Secuencia de Cursos</Label>
                  <p className="text-sm text-muted-foreground mb-2">Añade cursos al plan. El orden se puede ajustar más adelante.</p>
                  
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                        {selectedCourses.length > 0 ? `${selectedCourses.length} curso(s) seleccionado(s)` : "Seleccionar cursos..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar curso..." />
                        <CommandEmpty>No se encontró ningún curso.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {allCourses?.map((course) => (
                              <CommandItem
                                key={course.id}
                                value={course.title}
                                onSelect={() => handleSelectCourse(course)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedCourses.some(c => c.id === course.id) ? "opacity-100" : "opacity-0")} />
                                {course.title}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="mt-4 space-y-2">
                    {selectedCourses.map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between rounded-lg border p-3">
                         <div className="flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <span className="font-mono text-xs text-muted-foreground w-4">{index + 1}.</span>
                            <span className="font-medium">{course.title}</span>
                         </div>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSelectCourse(course)}>
                            <X className="h-4 w-4"/>
                         </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Plan de Carrera
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
