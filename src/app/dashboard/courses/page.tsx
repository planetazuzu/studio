import Link from 'next/link';
import { PlusCircle, ListFilter } from 'lucide-react';
import { courses, user } from '@/lib/data';
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

export default function CoursesPage() {
  const canCreateCourse = ['Jefe de Formación', 'Administrador General'].includes(user.role);

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
                <DropdownMenuCheckboxItem checked>Online</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Presencial</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Mixta</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canCreateCourse && (
              <Button size="sm" className="h-9 gap-1" asChild>
                  <Link href="/dashboard/courses/new">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Crear Curso</span>
                  </Link>
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
