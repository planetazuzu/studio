
'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, ListFilter, Loader2, Sparkles, Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllCourses, getUserProgressForUser } from '@/lib/db';
import { useAuth } from '@/contexts/auth';
import { CourseCard } from '@/components/course-card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Course } from '@/lib/types';


// The main component now reads search params and filters
function CoursesPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // State to ensure browser-only APIs are called on the client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const courses = useLiveQuery(
    () => (isClient ? getAllCourses() : []),
    [isClient],
    []
  );
  const userProgressData = useLiveQuery(
    () => (isClient && user ? getUserProgressForUser(user.id) : []),
    [isClient, user?.id],
    []
  );
  
  const [filters, setFilters] = useState({
    Online: true,
    Presencial: true,
    Mixta: true,
  });

  const progressMap = useMemo(() => {
    if (!userProgressData || !courses) return new Map<string, number>();

    const courseModuleCounts = new Map(courses.map(c => [c.id, c.modules.length]));

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
  }, [userProgressData, courses]);

  const canCreateCourse = useMemo(() => {
    if (!user) return false;
    return ['Jefe de Formación', 'Administrador General'].includes(user.role);
  }, [user]);
  
  const searchQuery = searchParams.get('q') || '';

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter(course => 
      // Visibility Check: Managers see all, non-draft courses are visible to others
      (canCreateCourse || course.status !== 'draft') &&
      // Modality filter
      filters[course.modality] &&
      // Search query filter
      (
        searchQuery === '' ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [courses, filters, searchQuery, canCreateCourse]);

  // Handle loading state while client mounts and dexie initializes
  if (!isClient || !user) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  const handleFilterChange = (modality: keyof typeof filters, checked: boolean) => {
    setFilters(prev => ({ ...prev, [modality]: checked }));
  };

  const allModalities: (keyof typeof filters)[] = ['Online', 'Presencial', 'Mixta'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Formaciones</h1>
          <p className="text-muted-foreground">Explora, inscríbete y mejora tus competencias.</p>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filtrar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por modalidad</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allModalities.map(modality => (
                  <DropdownMenuCheckboxItem
                    key={modality}
                    checked={filters[modality]}
                    onCheckedChange={(checked) => handleFilterChange(modality, !!checked)}
                  >
                    {modality}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {canCreateCourse && (
              <Button size="sm" className="h-9 gap-1" asChild>
                <Link href="/dashboard/courses/create">
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Crear Curso</span>
                </Link>
              </Button>
            )}
        </div>
      </div>

       {searchQuery && (
        <p className="text-muted-foreground">
          Mostrando resultados para: <span className="font-semibold text-foreground">"{searchQuery}"</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard 
                key={course.id} 
                course={course}
                user={user}
                progress={progressMap.get(course.id) || 0}
                canManage={canCreateCourse} 
            />
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">
             {searchQuery ? `No se encontraron cursos para "${searchQuery}".` : "No se encontraron cursos con los filtros seleccionados."}
          </p>
        )}
      </div>
    </div>
  );
}


export default function CoursesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Cargando...</p>
            </div>
      </div>}>
            <CoursesPageContent />
        </Suspense>
    )
}
