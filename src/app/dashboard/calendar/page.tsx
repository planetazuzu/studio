
'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';

import { getAllCourses } from '@/lib/db';
import type { Course } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const courses = useLiveQuery(getAllCourses);

  const eventDays = useMemo(() => {
    if (!courses) return [];
    return courses
      .filter(course => !!course.startDate)
      .map(course => parseISO(course.startDate!));
  }, [courses]);

  const selectedDayCourses = useMemo(() => {
    if (!courses || !date) return [];
    return courses.filter(course => 
      course.startDate && isSameDay(parseISO(course.startDate), date)
    );
  }, [courses, date]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendario de Formación</h1>
        <p className="text-muted-foreground">
          Visualiza y gestiona la programación de los cursos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
              locale={es}
              modifiers={{ events: eventDays }}
              modifiersClassNames={{
                events: "bg-primary/20 text-primary rounded-full",
              }}
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>
              Formaciones para el {date ? format(date, 'd MMM, yyyy', { locale: es }) : '...'}
            </CardTitle>
            <CardDescription>
              Cursos programados para el día seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDayCourses.length > 0 ? (
              selectedDayCourses.map(course => (
                <div key={course.id} className="p-4 rounded-lg border bg-muted/50">
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.instructor}</p>
                  <div className="mt-2 flex justify-between items-center text-xs">
                    <Badge variant={course.modality === 'Presencial' ? 'default' : 'secondary'}>{course.modality}</Badge>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(course.startDate!), 'HH:mm')}h
                    </span>
                  </div>
                   <Button asChild variant="outline" size="sm" className="w-full mt-4">
                      <Link href={`/dashboard/courses/${course.id}`}>Ver Curso</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-8">
                No hay cursos programados para este día.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
