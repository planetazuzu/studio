'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Activity, BookCheck, BotMessageSquare, GraduationCap, Lightbulb, Loader2, Wallet, Check, X, Inbox, Megaphone, AlertTriangle, Info, Wrench, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { personalizedCourseRecommendations } from '@/ai/flows/course-suggestion';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import Image from 'next/image';
import type { PendingEnrollmentDetails, Course, User, Announcement, AnnouncementType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


function AnnouncementsPanel({ user }: { user: User }) {
    const announcements = useLiveQuery(() => db.getVisibleAnnouncementsForUser(user), [user], []);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const announcementIcons: Record<AnnouncementType, React.ElementType> = {
        'Urgente': AlertTriangle,
        'Informativo': Info,
        'Mantenimiento': Wrench,
    };

    const announcementColors: Record<AnnouncementType, string> = {
        'Urgente': 'border-destructive/50 bg-destructive/5 text-destructive',
        'Informativo': 'border-blue-500/50 bg-blue-500/5 text-blue-600',
        'Mantenimiento': 'border-amber-500/50 bg-amber-500/5 text-amber-600',
    };

    if (!announcements) {
        return (
            <Card className="shadow-lg col-span-1 lg:col-span-3">
                 <CardContent className="flex justify-center items-center h-24">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (announcements.length === 0) {
        return null; // Don't show the panel if there are no announcements
    }

    return (
        <Card className="shadow-lg col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle>Avisos Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.slice(0, 3).map(announcement => {
                    const Icon = announcementIcons[announcement.type];
                    return (
                        <div key={announcement.id} className={cn("flex items-start gap-4 rounded-lg border p-4", announcementColors[announcement.type])}>
                            <Icon className="h-6 w-6 mt-1 flex-shrink-0" />
                            <div className="flex-grow">
                                <h3 className="font-bold">{announcement.title}</h3>
                                <p className="text-sm mt-1">{announcement.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {isClient ? formatDistanceToNow(new Date(announcement.timestamp), { addSuffix: true, locale: es }) : '...'}
                                </p>
                            </div>
                            <Badge variant={announcement.type === 'Urgente' ? 'destructive' : 'secondary'} className="h-fit">{announcement.type}</Badge>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}

function MandatoryCoursesPanel({ user }: { user: User }) {
    const incompleteCourses = useLiveQuery(() => db.getIncompleteMandatoryCoursesForUser(user), [user.id], []);

    if (incompleteCourses === undefined) {
        return (
             <Card className="shadow-lg col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle /> Formación Obligatoria Pendiente
                    </CardTitle>
                </CardHeader>
                 <CardContent className="flex justify-center items-center h-24">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (incompleteCourses.length === 0) {
        return null; // Don't show the panel if everything is complete
    }
    
    return (
         <Card className="shadow-lg col-span-1 lg:col-span-3 border-amber-500/50 bg-amber-500/5">
            <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                    <AlertTriangle /> Formación Obligatoria Pendiente
                </CardTitle>
                <CardDescription>
                    Tienes los siguientes cursos obligatorios por completar para cumplir con los requisitos de tu rol.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <ul className="space-y-3">
                    {incompleteCourses.map(course => (
                        <li key={course.id} className="flex items-center justify-between gap-4 p-3 bg-background rounded-lg border">
                             <div>
                                <h3 className="font-semibold text-primary">{course.title}</h3>
                                <p className="text-sm text-muted-foreground">Asignado a tu rol: {user.role}</p>
                            </div>
                            <Button asChild>
                                <Link href={`/dashboard/courses/${course.id}`}>Ir al Curso</Link>
                            </Button>
                        </li>
                    ))}
                 </ul>
            </CardContent>
        </Card>
    )
}

function MyCourses({ user }) {
  const enrolledCourses = useLiveQuery(
    () => db.getEnrolledCoursesForUser(user.id),
    [user.id], 
    [] as Course[]
  );
  
  const userProgressData = useLiveQuery(() => db.getUserProgressForUser(user.id), [user.id]);

  const progressMap = useMemo(() => {
    if (!userProgressData || !enrolledCourses) return new Map<string, number>();
    
    const courseModuleCounts = new Map(enrolledCourses.map(c => [c.id, c.modules.length]));

    return userProgressData.reduce((map, progress) => {
        const totalModules = courseModuleCounts.get(progress.courseId) || 0;
        if (totalModules > 0) {
            const percentage = Math.round((progress.completedModules.length / totalModules) * 100);
            map.set(progress.courseId, percentage);
        } else {
             map.set(progress.courseId, 0);
        }
        return map;
    }, new Map<string, number>());
  }, [userProgressData, enrolledCourses]);


  if (!enrolledCourses || !userProgressData) {
    return (
      <Card className="shadow-lg col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Mis Cursos</CardTitle>
          <CardDescription>Tus formaciones activas.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Mis Cursos</CardTitle>
        <CardDescription>Tus formaciones activas y en progreso.</CardDescription>
      </CardHeader>
      <CardContent>
        {enrolledCourses.length > 0 ? (
          <ul className="space-y-4">
            {enrolledCourses.map((course) => {
                const progress = progressMap.get(course.id) || 0;
                return (
                  <li key={course.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                    <Image src={course.image} alt={course.title} width={80} height={60} className="rounded-md object-cover" data-ai-hint={course.aiHint} />
                    <div className="flex-grow">
                      <h3 className="font-semibold">{course.title}</h3>
                      <Progress value={progress} className="h-2 mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">{progress}% completado</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/courses/${course.id}`}>Continuar</Link>
                    </Button>
                  </li>
                );
            })}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="mx-auto h-12 w-12" />
            <p className="mt-2">Aún no estás inscrito en ningún curso.</p>
            <Button asChild size="sm" className="mt-4">
                <Link href="/dashboard/courses">Explorar Cursos</Link>
            </Button>
          </div>
        )}
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
    
    const handleApproval = async (id: number, studentId: string, courseId: string, approved: boolean) => {
        await db.updateEnrollmentStatus(id, studentId, courseId, approved ? 'approved' : 'rejected');
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
                                    <Button size="icon" variant="outline" className="text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => handleApproval(e.id!, e.studentId, e.courseId, true)}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => handleApproval(e.id!, e.studentId, e.courseId, false)}>
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
       <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
         <MandatoryCoursesPanel user={user} />
         <AnnouncementsPanel user={user} />
       </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {isAdmin && <AdminApprovalPanel />}
        {!isAdmin && <MyCourses user={user} />}
        <AiSuggestions user={user} />
      </div>
    </div>
  );
}
