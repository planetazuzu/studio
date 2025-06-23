import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/dashboard/courses/${course.id}`} className="block">
      <Card className="flex h-full flex-col overflow-hidden shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={course.image}
              alt={course.title}
              layout="fill"
              objectFit="cover"
              data-ai-hint={course.aiHint}
            />
             <Badge className="absolute top-3 right-3">{course.modality}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4">
          <CardTitle className="mb-2 text-lg font-semibold">{course.title}</CardTitle>
          <CardDescription className="flex-grow text-sm text-muted-foreground">{course.description}</CardDescription>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{course.modules.length} Módulos</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4 pt-0">
            <div className="w-full">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} aria-label={`${course.progress}% completado`} />
            </div>
          <Button variant="outline" className="w-full">
            Ver Curso
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
