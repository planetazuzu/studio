'use server';

import * as db from '@/lib/db';

export async function sendAnnouncementAction(courseId: string, courseTitle: string, message: string) {
    const students = await db.getStudentsForCourseManagement(courseId);
    if (students.length === 0) {
        return { success: false, message: 'No hay estudiantes inscritos para notificar.' };
    }

    const notifications = students.map(student => ({
        userId: student.id,
        message: `Anuncio en "${courseTitle}": ${message}`,
        type: 'course_announcement' as const,
        relatedUrl: `/dashboard/courses/${courseId}`,
        isRead: false,
        timestamp: new Date().toISOString(),
    }));

    for (const notification of notifications) {
        await db.addNotification(notification);
    }
    
    return { success: true, message: `Anuncio enviado a ${students.length} estudiante(s).` };
}
