'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, BookCheck, BotMessageSquare, GraduationCap, Lightbulb, Loader2, Wallet, Check, X, Inbox } from 'lucide-react';
import { personalizedCourseRecommendations } from '@/ai/flows/course-suggestion';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { courses } from '@/lib/data';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import Image from 'next/image';
import type { PendingEnrollmentDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function UpcomingCourses() {
    const upcoming = courses.slice(0, 3);
    return (
        <Card className="shadow-lg col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Próximas Formaciones</CardTitle>
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

function AiSuggestions({ user }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const result = await personalizedCourseRecommendations({
        userProfile: `Rol: ${user.role}, Intereses: Soporte Vital, Comunicaciones de emergencia`,
        learningHistory: 'Completado: Conducción de Vehículos de Emergencia, En Progreso: Soporte Vital Básico',
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
        <CardDescription>Formaciones recomendadas para tu perfil.</CardDescription>
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

function AdminApprovalPanel() {
    const [enrollments, setEnrollments] = useState<PendingEnrollmentDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchEnrollments = async () => {
        setLoading(true);
        const data = await db.getPendingEnrollmentsWithDetails();
        setEnrollments(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchEnrollments();
    }, []);
    
    const handleApproval = async (id: number, approved: boolean) => {
        await db.updateEnrollmentStatus(id, approved ? 'approved' : 'rejected');
        toast({
            title: `Solicitud ${approved ? 'aprobada' : 'rechazada'}`,
            description: "La lista de solicitudes ha sido actualizada.",
        })
        fetchEnrollments(); // Refresh the list
    }

    return (
        <Card className="shadow-lg col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Solicitudes de Inscripción Pendientes</CardTitle>
                <CardDescription>Aprueba o rechaza las solicitudes de inscripción a cursos.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin"/> :
                 enrollments.length > 0 ? (
                    <ul className="space-y-3">
                        {enrollments.map(e => (
                            <li key={e.id} className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p><span className="font-bold">{e.userName}</span> quiere inscribirse en</p>
                                    <p className="text-primary font-semibold">{e.courseTitle}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" className="text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => handleApproval(e.id!, true)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => handleApproval(e.id!, false)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Inbox className="mx-auto h-12 w-12" />
                        <p className="mt-2">No hay solicitudes pendientes.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null; // Should be handled by layout, but as a safeguard.

  const canViewCosts = ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);
  const isAdmin = user.role === 'Administrador General';

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
        {canViewCosts && <StatCard title="Coste Total" value="8,950€" icon={Wallet} description="Presupuesto: 15,000€" />}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {isAdmin && <AdminApprovalPanel />}
        {!isAdmin && <UpcomingCourses />}
        <AiSuggestions user={user} />
      </div>
    </div>
  );
}
