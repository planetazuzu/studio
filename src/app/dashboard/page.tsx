'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Activity, BookCheck, BotMessageSquare, GraduationCap, Lightbulb, Loader2, Wallet } from 'lucide-react';
import { personalizedCourseRecommendations } from '@/ai/flows/course-suggestion';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { courses, user } from '@/lib/data';
import Image from 'next/image';

function UpcomingCourses() {
    const upcoming = courses.slice(0, 3);
    return (
        <Card className="shadow-lg col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Próximos Cursos</CardTitle>
                <CardDescription>Cursos programados para empezar pronto.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {upcoming.map((course) => (
                        <li key={course.id} className="flex items-center gap-4">
                            <Image src={course.image} alt={course.title} width={80} height={60} className="rounded-md object-cover" data-ai-hint={course.aiHint} />
                            <div className="flex-grow">
                                <h3 className="font-semibold">{course.title}</h3>
                                <p className="text-sm text-muted-foreground">{course.instructor}</p>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/courses/${course.id}`}>Ver</Link>
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function AiSuggestions() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const result = await personalizedCourseRecommendations({
        userProfile: `Rol: ${user.role}, Intereses: Liderazgo, Nuevas Tecnologías`,
        learningHistory: 'Completado: Excel Avanzado, En Progreso: Gestión de Proyectos',
      });
      setRecommendations(result.courseRecommendations);
    } catch (e) {
      setError('No se pudieron generar las sugerencias. Inténtelo de nuevo.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg col-span-1 lg:col-span-1">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <CardTitle>Sugerencias de la IA</CardTitle>
        </div>
        <CardDescription>Cursos recomendados para tu perfil.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : recommendations.length > 0 ? (
          <ul className="space-y-2 text-left">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-1 text-yellow-400" />
                <span className="font-medium">{rec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Pulsa el botón para obtener sugerencias.</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleGetSuggestions} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Generar Sugerencias
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {user.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad formativa.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Cursos Activos" value="4" icon={Activity} description="+2 desde el mes pasado" />
        <StatCard title="Formaciones Completadas" value="12" icon={BookCheck} description="Año actual" />
        <StatCard title="Certificados Obtenidos" value="8" icon={GraduationCap} description="Pendientes: 2" />
        <StatCard title="Coste Total" value="8,950€" icon={Wallet} description="Presupuesto: 15,000€" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <UpcomingCourses />
        <AiSuggestions />
      </div>
    </div>
  );
}
