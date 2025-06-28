
'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, Star } from 'lucide-react';
import * as db from '@/lib/db';
import type { Course, User, CourseRating } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function StarRatingInput({ rating, setRating, disabled }: { rating: number, setRating: (r: number) => void, disabled: boolean }) {
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        onClick={() => setRating(ratingValue)}
                        disabled={disabled}
                        className="disabled:opacity-50"
                    >
                        <Star className={cn(
                            "h-7 w-7 transition-colors",
                            ratingValue <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                        )} />
                    </button>
                )
            })}
        </div>
    );
}

function RatingForm({ course, user, onRatingSubmitted }: { course: Course, user: User, onRatingSubmitted: () => void }) {
    const { toast } = useToast();
    const [courseRating, setCourseRating] = useState(0);
    const [instructorRating, setInstructorRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (courseRating === 0 || instructorRating === 0 || !comment.trim()) {
            toast({
                title: 'Formulario incompleto',
                description: 'Por favor, completa todas las valoraciones y el comentario.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await db.addCourseRating({
                courseId: course.id,
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                instructorName: course.instructor,
                rating: courseRating,
                instructorRating: instructorRating,
                comment,
                timestamp: new Date().toISOString(),
            });
            toast({ title: '¡Gracias por tu valoración!' });
            onRatingSubmitted();
        } catch (error) {
            console.error("Failed to submit rating", error);
            toast({ title: 'Error', description: 'No se pudo enviar la valoración.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle>Deja tu valoración</CardTitle>
                <CardDescription>Tu feedback es muy importante para mejorar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg bg-background">
                    <p className="font-semibold">¿Qué te ha parecido el curso?</p>
                    <StarRatingInput rating={courseRating} setRating={setCourseRating} disabled={isSubmitting} />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg bg-background">
                    <p className="font-semibold">¿Cómo valorarías al instructor, {course.instructor}?</p>
                    <StarRatingInput rating={instructorRating} setRating={setInstructorRating} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="comment" className="font-semibold">Comentarios adicionales:</label>
                    <Textarea
                        id="comment"
                        placeholder="Escribe aquí tus comentarios sobre el curso, el contenido o el instructor..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Valoración
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function RatingsDisplay({ ratings }: { ratings: CourseRating[] }) {

    const avgCourseRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        return ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
    }, [ratings]);

    const avgInstructorRating = useMemo(() => {
        if (ratings.length === 0) return 0;
        return ratings.reduce((acc, r) => acc + r.instructorRating, 0) / ratings.length;
    }, [ratings]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Valoración Media del Curso</CardTitle>
                        <div className="text-4xl font-bold flex items-center justify-center gap-2 mt-2">
                            {avgCourseRating.toFixed(1)} <Star className="h-8 w-8 text-amber-400" />
                        </div>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Valoración Media del Instructor</CardTitle>
                         <div className="text-4xl font-bold flex items-center justify-center gap-2 mt-2">
                            {avgInstructorRating.toFixed(1)} <Star className="h-8 w-8 text-amber-400" />
                        </div>
                    </CardHeader>
                </Card>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-4">Comentarios de los Alumnos</h3>
                <div className="space-y-4">
                    {ratings.map(rating => (
                        <Card key={rating.id} className="p-4">
                             <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={rating.userAvatar} />
                                    <AvatarFallback>{rating.userName.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{rating.userName}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(rating.timestamp), { addSuffix: true, locale: es })}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic mt-2">"{rating.comment}"</p>
                                </div>
                             </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}


export function RatingTab({ course, user, progress }: { course: Course, user: User, progress: number }) {
    const [hasRated, setHasRated] = useState(false);
    
    // Check if the user has already submitted a rating for this course
    const userRating = useLiveQuery(
        () => db.getRatingByUserAndCourse(user.id, course.id),
        [user.id, course.id]
    );

    // Fetch all ratings for this course to display them
    const allRatings = useLiveQuery(
        () => db.getRatingsForCourse(course.id),
        [course.id],
        []
    );

    if (userRating === undefined || allRatings === undefined) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const canRate = progress === 100;
    const alreadyRated = !!userRating;

    return (
        <div>
            {canRate && !alreadyRated && (
                <RatingForm course={course} user={user} onRatingSubmitted={() => {}} />
            )}

            {alreadyRated && (
                 <div className="p-4 text-center bg-green-50 border-green-200 text-green-800 rounded-lg mb-6">
                    <p>¡Gracias por enviar tu valoración!</p>
                </div>
            )}
            
            {!canRate && (
                <div className="p-4 text-center bg-amber-50 border-amber-200 text-amber-800 rounded-lg mb-6">
                    <p>Debes completar el curso al 100% para poder dejar una valoración.</p>
                </div>
            )}
            
            <div className="mt-8">
                {allRatings.length > 0 ? (
                    <RatingsDisplay ratings={allRatings} />
                ) : (
                    <p className="text-center text-muted-foreground py-10">Aún no hay valoraciones para este curso. ¡Sé el primero!</p>
                )}
            </div>
        </div>
    );
}
