'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import * as db from '@/lib/db';
import type { Course } from '@/lib/types';

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState('');
  const [modality, setModality] = useState<'Online' | 'Presencial' | 'Mixta' | undefined>();
  const [image, setImage] = useState('https://placehold.co/600x400.png');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !longDescription || !instructor || !duration || !modality) {
        toast({
            title: "Error de Validación",
            description: "Por favor, completa todos los campos obligatorios.",
            variant: "destructive",
        });
        return;
    }

    const newCourseData: Omit<Course, 'id' | 'progress' | 'modules' | 'isSynced' | 'updatedAt' | 'startDate' | 'endDate'> = {
        title,
        description,
        longDescription,
        instructor,
        duration,
        modality,
        image,
        aiHint: title.toLowerCase().split(' ').slice(0, 2).join(' '),
    };

    try {
        await db.addCourse(newCourseData);
        toast({
        title: "Curso Creado",
        description: "El nuevo curso ha sido añadido al catálogo.",
        });
        router.push('/dashboard/courses');
    } catch (error) {
        console.error("Failed to create course", error);
        toast({
            title: "Error al Guardar",
            description: "No se pudo crear el curso. Inténtalo de nuevo.",
            variant: "destructive",
        })
    }
  };

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
            <CardTitle>Crear Nuevo Curso</CardTitle>
            <CardDescription>Completa el formulario para añadir una nueva formación al catálogo.</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="title">Título del Curso</Label>
                <Input id="title" placeholder="Ej: Soporte Vital Avanzado" required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="description">Descripción Corta</Label>
                <Textarea id="description" placeholder="Un resumen breve del curso para la tarjeta." required value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="longDescription">Descripción Larga</Label>
                <Textarea id="longDescription" placeholder="Descripción detallada que aparecerá en la página del curso." rows={5} required value={longDescription} onChange={e => setLongDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input id="instructor" placeholder="Ej: Dr. Alejandro Torres" required value={instructor} onChange={e => setInstructor(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="duration">Duración</Label>
                    <Input id="duration" placeholder="Ej: 16 horas" required value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="modality">Modalidad</Label>
                        <Select onValueChange={(value: any) => setModality(value)} value={modality}>
                            <SelectTrigger id="modality">
                                <SelectValue placeholder="Selecciona una modalidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Online">Online</SelectItem>
                                <SelectItem value="Presencial">Presencial</SelectItem>
                                <SelectItem value="Mixta">Mixta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image">URL de la Imagen</Label>
                        <Input id="image" placeholder="https://placehold.co/600x400.png" type="url" value={image} onChange={e => setImage(e.target.value)} required />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg">Guardar Curso</Button>
                </div>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
