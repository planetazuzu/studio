'use client';

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

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this data to your backend
    console.log('Form submitted');
    toast({
      title: "Curso Creado",
      description: "El nuevo curso ha sido añadido al catálogo (simulación).",
    });
    router.push('/dashboard/courses');
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
                <Input id="title" placeholder="Ej: Soporte Vital Avanzado" required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="description">Descripción Corta</Label>
                <Textarea id="description" placeholder="Un resumen breve del curso para la tarjeta." required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="longDescription">Descripción Larga</Label>
                <Textarea id="longDescription" placeholder="Descripción detallada que aparecerá en la página del curso." rows={5} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input id="instructor" placeholder="Ej: Dr. Alejandro Torres" required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="duration">Duración</Label>
                    <Input id="duration" placeholder="Ej: 16 horas" required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="modality">Modalidad</Label>
                        <Select>
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
                        <Input id="image" placeholder="https://placehold.co/600x400.png" type="url" defaultValue="https://placehold.co/600x400.png" required />
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
