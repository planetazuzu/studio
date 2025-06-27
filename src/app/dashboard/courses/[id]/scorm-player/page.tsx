
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, ArrowLeft, Tv, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ScormPlayerPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (courseId) {
      db.getCourseById(courseId).then(data => {
        setCourse(data || null);
        setIsLoading(false);
      });
    }
  }, [courseId]);

  const handleCompleteCourse = async () => {
    if (!user || !course || !course.modules) return;

    setIsCompleting(true);
    try {
      // Mark all modules as completed sequentially
      for (const module of course.modules) {
        await db.markModuleAsCompleted(user.id, course.id, module.id);
      }
      toast({
        title: '¡Curso Completado!',
        description: `Has completado "${course.title}" y tus puntos han sido actualizados.`,
      });
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error) {
      console.error('Failed to complete SCORM course', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la finalización del curso.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!course) {
    return <div>Curso no encontrado.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
       <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Descripción
          </Link>
      </Button>

      <Card>
          <CardHeader>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription>Visor de Contenido SCORM</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="aspect-video bg-muted border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8">
                  <Tv className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">El Contenido SCORM se mostraría aquí</h3>
                  <p className="text-muted-foreground">Esta es una simulación del reproductor. En una implementación real, el paquete SCORM se ejecutaría en este espacio.</p>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                      <h4 className="font-semibold">Simulación de Finalización</h4>
                      <p className="text-sm">Usa el botón de abajo para simular la finalización del curso. Esto marcará todos sus módulos como completados y te otorgará los puntos y medallas correspondientes.</p>
                  </div>
              </div>
          </CardContent>
      </Card>

      <div className="flex justify-end">
          <Button size="lg" onClick={handleCompleteCourse} disabled={isCompleting}>
              {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Finalizar y Marcar como Completado
          </Button>
      </div>
    </div>
  );
}
