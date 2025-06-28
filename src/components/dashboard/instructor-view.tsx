'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Calendar, GraduationCap, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import * as db from '@/lib/db';
import type { Course, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { StatCard } from '../stat-card';
import { Progress } from '../ui/progress';
import Image from 'next/image';
import { Button } from '../ui/button';

export function InstructorDashboardView({ user }: { user: User }) {
    const courses = useLiveQuery(() => db.getCoursesByInstructorName(user.name), [user.name]);

    const studentData = useLiveQuery(async () => {
        if (!courses) return [];

        const studentPromises = courses.map(course => 
            db.getStudentsForCourseManagement(course.id)
        );
        return Promise.all(studentPromises);
    }, [courses]);

    const courseStats = useMemo(() => {
        if (!courses || !studentData) return new Map();

        const statsMap = new Map<string, { studentCount: number, averageProgress: number }>();
        courses.forEach((course, index) => {
            const students = studentData[index] || [];
            const studentCount = students.length;
            const totalProgress = students.reduce((acc, student) => acc + student.progress, 0);
            const averageProgress = studentCount > 0 ? totalProgress / studentCount : 0;
            statsMap.set(course.id, { studentCount, averageProgress });
        });
        return statsMap;

    }, [courses, studentData]);
    
    const totalStudents = useMemo(() => {
       if (!studentData) return 0;
       const uniqueStudents = new Set<string>();
       studentData.flat().forEach(student => uniqueStudents.add(student.id));
       return uniqueStudents.size;
    }, [studentData]);

    if (courses === undefined) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Panel del Formador</h1>
                <p className="text-muted-foreground">Bienvenido, {user.name}. Aquí tienes un resumen de tu actividad docente.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Cursos Asignados" value={courses.length.toString()} icon={BookOpen} />
                <StatCard title="Alumnos Totales" value={totalStudents.toString()} icon={Users} description="En todos tus cursos" />
                <StatCard title="Próxima Clase" value="Mañana, 10:00" icon={Calendar} description="SVB - Aula 3" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Cursos</CardTitle>
                    <CardDescription>Gestiona tus cursos asignados y sigue el progreso de tus alumnos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {courses.length > 0 ? (
                        <div className="space-y-6">
                            {courses.map(course => {
                                const stats = courseStats.get(course.id) || { studentCount: 0, averageProgress: 0 };
                                return (
                                    <div key={course.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg">
                                        <Image
                                            src={course.image}
                                            alt={course.title}
                                            width={180}
                                            height={120}
                                            className="rounded-md object-cover aspect-video"
                                            data-ai-hint={course.aiHint}
                                        />
                                        <div className="flex-grow w-full">
                                            <h3 className="text-lg font-semibold">{course.title}</h3>
                                            <p className="text-sm text-muted-foreground">{course.description}</p>
                                            <div className="flex items-center gap-6 mt-3 text-sm">
                                                <div>
                                                    <p className="font-semibold">{stats.studentCount}</p>
                                                    <p className="text-xs text-muted-foreground">Alumnos</p>
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold">Progreso Medio</p>
                                                     <div className="flex items-center gap-2">
                                                        <Progress value={stats.averageProgress} className="h-2" />
                                                        <span className="text-xs font-semibold">{stats.averageProgress.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                         <Button asChild className="w-full mt-4 md:w-auto md:mt-0">
                                            <Link href={`/dashboard/courses/${course.id}`}>
                                                Gestionar Curso
                                            </Link>
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                         <div className="text-center py-12 text-muted-foreground">
                            <GraduationCap className="mx-auto h-12 w-12" />
                            <p className="mt-4 font-semibold">No tienes cursos asignados.</p>
                            <p className="text-sm">Contacta con un administrador para que te asigne formaciones.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
