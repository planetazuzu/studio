
'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { Loader2, Route, Check, Lock, PlayCircle } from 'lucide-react';
import * as db from '@/lib/db';
import type { User, Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function LearningPathPanel({ user }: { user: User }) {
  const learningPaths = useLiveQuery(() => db.getLearningPathsForUser(user), [user.id]);
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);

  const courseMap = useMemo(() => {
    if (!allCourses) return new Map<string, Course>();
    return new Map(allCourses.map(course => [course.id, course]));
  }, [allCourses]);

  if (learningPaths === undefined) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Planes de Carrera</CardTitle>
          <CardDescription>Tus rutas de aprendizaje asignadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const activePaths = learningPaths.filter(path => {
    const completedIds = path.progress?.completedCourseIds || [];
    return completedIds.length < path.courseIds.length;
  });

  if (activePaths.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Planes de Carrera</CardTitle>
          <CardDescription>Tus rutas de aprendizaje asignadas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-48 items-center justify-center text-center text-muted-foreground">
          <Route className="h-12 w-12" />
          <p className="mt-4 font-semibold">¡Todo al día!</p>
          <p className="text-sm">No tienes planes de carrera pendientes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Planes de Carrera</CardTitle>
        <CardDescription>Tus rutas de aprendizaje asignadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activePaths.map(path => {
          const completedIds = new Set(path.progress?.completedCourseIds || []);
          const totalSteps = path.courseIds.length;
          const completedSteps = path.courseIds.filter(id => completedIds.has(id)).length;
          const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
          
          let nextCourseId: string | null = null;
          for (const courseId of path.courseIds) {
            if (!completedIds.has(courseId)) {
              nextCourseId = courseId;
              break;
            }
          }
          const nextCourse = nextCourseId ? courseMap.get(nextCourseId) : null;

          return (
            <div key={path.id} className="space-y-3">
              <h3 className="font-semibold">{path.title}</h3>
              <Progress value={progressPercentage} />
              <p className="text-sm text-muted-foreground">
                Paso {completedSteps + 1} de {totalSteps}.
              </p>
              {nextCourse ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary">SIGUIENTE CURSO</p>
                    <p className="font-medium">{nextCourse.title}</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/courses/${nextCourse.id}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Empezar
                    </Link>
                  </Button>
                </div>
              ) : (
                 <div className="flex items-center justify-between rounded-lg border bg-green-100 p-3 text-green-800">
                   <p className="font-medium">¡Plan de carrera completado!</p>
                   <Check className="h-5 w-5"/>
                 </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
