
import Dexie, { type Table } from 'dexie';
import type { Course, User, Enrollment, UserProgress, PendingEnrollmentDetails, ForumMessage, ForumMessageWithReplies, Notification, Resource, CourseResource, Announcement, ChatChannel, ChatMessage, Role, ComplianceReportData, DirectMessageThread, CalendarEvent, ExternalTraining, EnrollmentStatus, EnrollmentWithDetails, Cost, StudentForManagement, AIConfig, AIUsageLog, Badge, UserBadge, UserStatus, CustomCostCategory, LearningPath, UserLearningPathProgress, CourseRating, RolePermission, SystemLog, LogLevel } from './types';
import { courses as initialCourses, users as initialUsers, initialChatChannels, initialCosts, defaultAIConfig, roles, departments, initialBadges, initialCostCategories } from './data';
import { sendEmailNotification, sendPushNotification, sendWhatsAppNotification } from './notification-service';
import { getNavItems } from './nav';
import { differenceInDays, isAfter } from 'date-fns';

const LOGGED_IN_USER_KEY = 'loggedInUserId';

export class AcademiaAIDB extends Dexie {
  courses!: Table<Course>;
  users!: Table<User>;
  enrollments!: Table<Enrollment>;
  userProgress!: Table<UserProgress>;
  forumMessages!: Table<ForumMessage>;
  notifications!: Table<Notification>;
  resources!: Table<Resource>;
  courseResources!: Table<CourseResource>;
  announcements!: Table<Announcement>;
  chatChannels!: Table<ChatChannel>;
  chatMessages!: Table<ChatMessage>;
  calendarEvents!: Table<CalendarEvent>;
  externalTrainings!: Table<ExternalTraining>;
  costs!: Table<Cost>;
  aiConfig!: Table<AIConfig>;
  aiUsageLog!: Table<AIUsageLog>;
  badges!: Table<Badge>;
  userBadges!: Table<UserBadge>;
  costCategories!: Table<CustomCostCategory>;
  learningPaths!: Table<LearningPath>;
  userLearningPathProgress!: Table<UserLearningPathProgress>;
  courseRatings!: Table<CourseRating>;
  rolePermissions!: Table<RolePermission>;
  systemLogs!: Table<SystemLog>;


  constructor() {
    super('AcademiaAIDB');
    this.version(28).stores({
      courses: 'id, instructor, status, isScorm, isSynced, *mandatoryForRoles',
      users: 'id, &email, status, points, isSynced',
      enrollments: '++id, studentId, courseId, status, [studentId+status]',
      userProgress: '++id, [userId+courseId], userId, courseId',
      forumMessages: '++id, courseId, parentId, timestamp',
      notifications: '++id, userId, isRead, timestamp, [userId+timestamp]',
      resources: '++id, name',
      courseResources: '++id, [courseId+resourceId]',
      announcements: '++id, timestamp',
      chatChannels: 'id, name, type, *participantIds',
      chatMessages: '++id, channelId, timestamp, [channelId+timestamp]',
      calendarEvents: '++id, courseId, start, end, isSynced',
      externalTrainings: '++id, userId',
      costs: '++id, category, courseId, date',
      aiConfig: 'id',
      aiUsageLog: '++id, timestamp',
      badges: 'id',
      userBadges: '++id, [userId+badgeId]',
      costCategories: '++id, &name',
      learningPaths: '++id, targetRole',
      userLearningPathProgress: '++id, [userId+learningPathId]',
      courseRatings: '++id, [courseId+userId], courseId, instructorName',
      rolePermissions: '&role',
      systemLogs: '++id, timestamp, level',
    });
  }
}

export const db = new AcademiaAIDB();

// --- Database Population ---

export async function populateDatabase() {
  const adminUser = await db.users.get('user_1');

  if (!adminUser || adminUser.status !== 'approved') {
    console.warn("Main admin user not found or has incorrect status. Resetting and populating database with initial data...");
    
    await Promise.all([
      db.courses.clear(),
      db.users.clear(),
      db.enrollments.clear(),
      db.userProgress.clear(),
      db.forumMessages.clear(),
      db.notifications.clear(),
      db.resources.clear(),
      db.courseResources.clear(),
      db.announcements.clear(),
      db.chatChannels.clear(),
      db.chatMessages.clear(),
      db.calendarEvents.clear(),
      db.externalTrainings.clear(),
      db.costs.clear(),
      db.aiConfig.clear(),
      db.aiUsageLog.clear(),
      db.badges.clear(),
      db.userBadges.clear(),
      db.costCategories.clear(),
      db.learningPaths.clear(),
      db.userLearningPathProgress.clear(),
      db.courseRatings.clear(),
      db.rolePermissions.clear(),
      db.systemLogs.clear(),
    ]);

    console.log("Tables cleared. Repopulating with initial data...");

    const initialPermissions: RolePermission[] = roles.map(role => {
        const visibleNavs = getNavItems()
            .filter(item => item.roles.includes(role))
            .map(item => item.href);
        return { role, visibleNavs };
    });

    await db.courses.bulkAdd(initialCourses.map(c => ({...c, isSynced: true})));
    await db.users.bulkAdd(initialUsers.map(u => ({...u, isSynced: true})));
    await db.chatChannels.bulkAdd(initialChatChannels);
    await db.costs.bulkAdd(initialCosts.map(c => ({...c, isSynced: true})));
    await db.aiConfig.add(defaultAIConfig);
    await db.badges.bulkAdd(initialBadges);
    await db.costCategories.bulkAdd(initialCostCategories.map(name => ({ name })));
    await db.rolePermissions.bulkAdd(initialPermissions);


    console.log("Database population complete.");
  }
}

// --- Authentication Functions ---

export async function login(email: string, password?: string): Promise<User | null> {
    const user = await db.users.where('email').equalsIgnoreCase(email).first();
    if (!user) {
        throw new Error('El usuario no existe.');
    }
    if (user.password !== password) {
        throw new Error('La contraseña es incorrecta.');
    }
    if (user.status === 'suspended') {
        throw new Error('Esta cuenta ha sido desactivada. Contacta con un administrador.');
    }
    if (user.status === 'pending_approval') {
         throw new Error('Esta cuenta está pendiente de aprobación por un administrador.');
    }
    
    localStorage.setItem(LOGGED_IN_USER_KEY, user.id);
    return user;
}

export function logout(): void {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
}

export async function getLoggedInUser(): Promise<User | null> {
    const userId = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (!userId) return null;
    const user = await db.users.get(userId);
    return user || null;
}


// --- User Management Functions ---
export async function addUser(user: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>): Promise<string> {
    const existingUser = await db.users.where('email').equalsIgnoreCase(user.email).first();
    if (existingUser) {
        throw new Error('Este correo electrónico ya está registrado.');
    }
    
    const requiresApproval = ['Formador', 'Jefe de Formación', 'Gestor de RRHH', 'Administrador General'].includes(user.role);

    const newUser: User = {
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}`,
        status: requiresApproval ? 'pending_approval' : 'approved',
        isSynced: false,
        points: 0,
        updatedAt: new Date().toISOString(),
        notificationSettings: {
            consent: false,
            channels: [],
        },
    };
    return await db.users.add(newUser);
}

export async function bulkAddUsers(users: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>[]): Promise<string[]> {
    const newUsers: User[] = users.map(user => ({
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}${Math.random()}`,
        status: 'approved',
        isSynced: false,
        points: 0,
        updatedAt: new Date().toISOString(),
        notificationSettings: {
            consent: false,
            channels: [],
        },
    }));
    return await db.users.bulkAdd(newUsers, { allKeys: true });
}

export async function getAllUsers(): Promise<User[]> {
    return await db.users.toArray();
}

export async function getUserById(id: string): Promise<User | undefined> {
    return await db.users.get(id);
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id' | 'isSynced' | 'password'>>): Promise<number> {
    return await db.users.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<number> {
    return await db.users.update(userId, { status, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function saveFcmToken(userId: string, fcmToken: string): Promise<number> {
    return await db.users.update(userId, { fcmToken, isSynced: false, updatedAt: new Date().toISOString() });
}

export async function deleteUser(id: string): Promise<void> {
    await db.users.delete(id);
}


// --- Data Access Functions ---

export async function addCourse(course: Partial<Omit<Course, 'id' | 'isSynced' | 'updatedAt'>>): Promise<string> {
  const newCourse: Course = {
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    title: course.title || 'Sin Título',
    description: course.description || '',
    longDescription: course.longDescription || '',
    instructor: course.instructor || 'Por definir',
    duration: course.duration || 'Por definir',
    modality: course.modality || 'Online',
    image: course.image || 'https://placehold.co/600x400.png',
    aiHint: course.aiHint || '',
    modules: course.modules || [],
    status: course.status || 'draft',
    mandatoryForRoles: course.mandatoryForRoles || [],
    isScorm: course.isScorm || false,
    scormPackage: course.scormPackage,
    isSynced: false,
    updatedAt: new Date().toISOString(),
    ...(course.startDate && { startDate: course.startDate }),
    ...(course.endDate && { endDate: course.endDate }),
  };
  
  return await db.courses.add(newCourse);
}


export async function getAllCourses(): Promise<Course[]> {
  return await db.courses.toArray();
}

export async function getCourseById(id: string): Promise<Course | undefined> {
    return await db.courses.get(id);
}

export async function updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number> {
    return await db.courses.update(id, { ...data, isSynced: false, updatedAt: new Date().toISOString() });
}

export async function updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number> {
    return await db.courses.update(id, { status, isSynced: false, updatedAt: new Date().toISOString() });
}

export async function deleteCourse(id: string): Promise<void> {
    return db.transaction('rw', db.courses, db.enrollments, db.userProgress, async () => {
        await db.enrollments.where('courseId').equals(id).delete();
        await db.userProgress.where('courseId').equals(id).delete();
        await db.courses.delete(id);
    });
}


// --- Enrollment Functions ---

export async function requestEnrollment(courseId: string, studentId: string): Promise<number> {
    const newEnrollment: Enrollment = {
        studentId,
        courseId,
        requestDate: new Date().toISOString(),
        status: 'pending',
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.enrollments.add(newEnrollment);
}

export async function getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]> {
  const pendingEnrollments = await db.enrollments.where('status').equals('pending').toArray();
  if (pendingEnrollments.length === 0) return [];
  
  const userIds = [...new Set(pendingEnrollments.map(e => e.studentId))];
  const courseIds = [...new Set(pendingEnrollments.map(e => e.courseId))];

  const users = await db.users.where('id').anyOf(userIds).toArray();
  const courses = await db.courses.where('id').anyOf(courseIds).toArray();

  const userMap = new Map(users.map(u => [u.id, u]));
  const courseMap = new Map(courses.map(c => [c.id, c]));

  return pendingEnrollments.map(e => ({
    ...e,
    userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
    courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
  }));
}

export async function getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]> {
    const allEnrollments = await db.enrollments.toArray();
    if (allEnrollments.length === 0) return [];

    const userIds = [...new Set(allEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(allEnrollments.map(e => e.courseId))];

    const users = await db.users.where('id').anyOf(userIds).toArray();
    const courses = await db.courses.where('id').anyOf(courseIds).toArray();

    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));

    return allEnrollments.map(e => ({
        ...e,
        userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
        userEmail: userMap.get(e.studentId)?.email || 'Email desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
        courseImage: courseMap.get(e.courseId)?.image || 'https://placehold.co/600x400.png',
    }));
}

export async function getEnrollmentsForStudent(userId: string): Promise<EnrollmentWithDetails[]> {
    const studentEnrollments = await db.enrollments.where('studentId').equals(userId).toArray();
    if (studentEnrollments.length === 0) return [];

    const courseIds = [...new Set(studentEnrollments.map(e => e.courseId))];
    const courses = await db.courses.where('id').anyOf(courseIds).toArray();
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const user = await db.users.get(userId);

    return studentEnrollments.map(e => ({
        ...e,
        userName: user?.name || 'Usuario desconocido',
        userEmail: user?.email || 'Email desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
        courseImage: courseMap.get(e.courseId)?.image || 'https://placehold.co/600x400.png',
    })).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
}


export async function updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number> {
    const enrollment = await db.enrollments.get(enrollmentId);
    if (!enrollment) return 0;
    
    const result = await db.enrollments.update(enrollmentId, { status, justification, updatedAt: new Date().toISOString(), isSynced: false });

    if (status === 'approved') {
        const course = await db.courses.get(enrollment.courseId);
        if (course) {
            await addNotification({
                userId: enrollment.studentId,
                message: `Tu inscripción a "${course.title}" ha sido aprobada.`,
                type: 'enrollment_approved',
                relatedUrl: `/dashboard/courses/${enrollment.courseId}`,
                isRead: false,
                timestamp: new Date().toISOString(),
            });
            // Automatically mark the status as 'active' if the course has started
            if (course.startDate && new Date(course.startDate) <= new Date()) {
                await db.enrollments.update(enrollmentId, { status: 'active' });
            }
        }
    }
    return result;
}


export async function getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
  const approvedEnrollments = await db.enrollments
    .where('studentId').equals(userId)
    .filter(e => e.status === 'approved' || e.status === 'active')
    .toArray();
  
  if (approvedEnrollments.length === 0) return [];

  const courseIds = approvedEnrollments.map(e => e.courseId);
  
  const enrolledCourses = await db.courses.where('id').anyOf(courseIds).and(course => course.status !== 'draft').toArray();

  return enrolledCourses;
}

export async function getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]> {
    const allCourses = await db.courses.toArray();
    const mandatoryCourses = allCourses.filter(c => 
        c.status === 'published' && c.mandatoryForRoles?.includes(user.role)
    );

    if (mandatoryCourses.length === 0) {
        return [];
    }

    const userProgressRecords = await db.userProgress.where('userId').equals(user.id).toArray();
    const progressMap = new Map(userProgressRecords.map(p => [p.courseId, p]));

    const incompleteCourses = mandatoryCourses.filter(course => {
        const progress = progressMap.get(course.id);
        
        const isCompleted = 
            progress && 
            course.modules && 
            course.modules.length > 0 && 
            progress.completedModules.length === course.modules.length;

        return !isCompleted;
    });

    return incompleteCourses;
}


// --- User Progress Functions ---

export async function getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    return await db.userProgress.where({ userId, courseId }).first();
}

export async function getUserProgressForUser(userId: string): Promise<UserProgress[]> {
    return await db.userProgress.where({ userId }).toArray();
}

export async function markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void> {
    return db.transaction('rw', db.users, db.userProgress, db.badges, db.userBadges, db.notifications, async () => {
        const existingProgress = await getUserProgress(userId, courseId);
        const user = await getUserById(userId);

        if (!user) return;

        if (existingProgress) {
            const completed = new Set(existingProgress.completedModules);
            if (completed.has(moduleId)) return;
            completed.add(moduleId);
            await db.userProgress.update(existingProgress.id!, { 
                completedModules: Array.from(completed),
                updatedAt: new Date().toISOString(),
                isSynced: false,
            });
        } else {
            await db.userProgress.add({
                userId,
                courseId,
                completedModules: [moduleId],
                updatedAt: new Date().toISOString(),
                isSynced: false,
            });
        }

        await db.users.update(userId, { points: (user.points || 0) + 10 });
        
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            await awardBadge(userId, 'weekend_warrior');
        }
        await checkAndAwardModuleBadges(userId);

        const course = await getCourseById(courseId);
        const updatedProgress = await getUserProgress(userId, courseId);
        if(course && updatedProgress && course.modules && updatedProgress.completedModules.length === course.modules.length) {
            await handleCourseCompletion(userId, courseId);
        }
    });
}

// --- Forum Functions ---

export async function addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newMessage: ForumMessage = {
        ...message,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    }
    const newId = await db.forumMessages.add(newMessage);

    await db.transaction('rw', db.users, db.forumMessages, db.userBadges, db.notifications, async () => {
        const user = await db.users.get(message.userId);
        if (!user) return;

        const pointsToAdd = message.parentId ? 2 : 5;
        await db.users.update(user.id, { points: (user.points || 0) + pointsToAdd });

        const userMessageCount = await db.forumMessages.where('userId').equals(user.id).count();
        if (userMessageCount === 1) {
            await awardBadge(user.id, 'forum_first_post');
        }
        if (userMessageCount === 5) {
            await awardBadge(user.id, 'forum_collaborator');
        }
    });
    
    return newId;
}

export async function getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]> {
    const messages = await db.forumMessages.where('courseId').equals(courseId).sortBy('timestamp');
    
    const messageMap = new Map<number, ForumMessageWithReplies>();
    const rootMessages: ForumMessageWithReplies[] = [];

    messages.forEach(msg => {
        messageMap.set(msg.id!, { ...msg, replies: [] });
    });

    messages.forEach(msg => {
        if (msg.parentId && messageMap.has(msg.parentId)) {
            messageMap.get(msg.parentId)!.replies.push(messageMap.get(msg.id!)!);
        } else {
            rootMessages.push(messageMap.get(msg.id!)!);
        }
    });

    return rootMessages.reverse();
}

export async function deleteForumMessage(messageId: number): Promise<void> {
    return db.transaction('rw', db.forumMessages, async () => {
        const messagesToDelete: number[] = [messageId];
        const queue: number[] = [messageId];

        while (queue.length > 0) {
            const parentId = queue.shift()!;
            const children = await db.forumMessages.where('parentId').equals(parentId).toArray();
            for (const child of children) {
                messagesToDelete.push(child.id!);
                queue.push(child.id!);
            }
        }
        
        await db.forumMessages.bulkDelete(messagesToDelete);
    });
}


// --- Notification Functions ---

export async function addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newNotification: Notification = {
        ...notification,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    }
    const newId = await db.notifications.add(newNotification);

    const user = await db.users.get(notification.userId);
    if (user && user.notificationSettings?.consent) {
        const settings = user.notificationSettings;
        const subject = `Notificación de AcademiaAI`;
        const body = notification.message;
        
        if (settings.channels.includes('email')) {
            await sendEmailNotification(user, subject, body);
        }
        if (settings.channels.includes('whatsapp') && user.phone) {
             await sendWhatsAppNotification(user, body);
        }
        if (settings.channels.includes('app') && user.fcmToken) {
            await sendPushNotification(user.id, 'Nueva Notificación', body, notification.relatedUrl || '/dashboard');
        }
    }
    
    return newId;
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await db.notifications.where({ userId }).reverse().sortBy('timestamp');
}

export async function markNotificationAsRead(notificationId: number): Promise<number> {
    return await db.notifications.update(notificationId, { isRead: true, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const unreadNotifications = await db.notifications.where({ userId, isRead: false }).toArray();
    if (unreadNotifications.length > 0) {
        const idsToUpdate = unreadNotifications.map(n => n.id!);
        await db.notifications.bulkUpdate(idsToUpdate.map(id => ({
            key: id,
            changes: { isRead: true, updatedAt: new Date().toISOString(), isSynced: false }
        })));
    }
}

export async function checkAndSendDeadlineReminders(user: User): Promise<void> {
    const enrolledCourses = await getEnrolledCoursesForUser(user.id);
    if (enrolledCourses.length === 0) return;

    const now = new Date();

    for (const course of enrolledCourses) {
        if (course.endDate) {
            const endDate = new Date(course.endDate);
            const daysUntilDeadline = differenceInDays(endDate, now);

            // Check if end date is in the future and within 7 days
            if (isAfter(endDate, now) && daysUntilDeadline <= 7) {
                // Check if a reminder was already sent for this course and user
                const existingReminder = await db.notifications
                    .where({ userId: user.id })
                    .filter(notif => notif.type === 'course_deadline_reminder' && notif.relatedUrl === `/dashboard/courses/${course.id}`)
                    .first();

                if (!existingReminder) {
                    await addNotification({
                        userId: user.id,
                        message: `¡Fecha límite próxima! El curso "${course.title}" finaliza en ${daysUntilDeadline + 1} día(s).`,
                        type: 'course_deadline_reminder',
                        relatedUrl: `/dashboard/courses/${course.id}`,
                        isRead: false,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }
    }
}

// --- Resource Library Functions ---

export async function addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newResource: Resource = {
        ...resource,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.resources.add(newResource);
}

export async function getAllResources(): Promise<Resource[]> {
    return await db.resources.orderBy('name').toArray();
}

export async function deleteResource(resourceId: number): Promise<void> {
    return db.transaction('rw', db.resources, db.courseResources, async () => {
        await db.courseResources.where('resourceId').equals(resourceId).delete();
        await db.resources.delete(resourceId);
    });
}

export async function associateResourceWithCourse(courseId: string, resourceId: number): Promise<void> {
    const existing = await db.courseResources.where({ courseId, resourceId }).first();
    if (!existing) {
        await db.courseResources.add({ courseId, resourceId });
    }
}

export async function dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void> {
    await db.courseResources.where({ courseId, resourceId }).delete();
}

export async function getResourcesForCourse(courseId: string): Promise<Resource[]> {
    const associations = await db.courseResources.where('courseId').equals(courseId).toArray();
    if (associations.length === 0) return [];

    const resourceIds = associations.map(a => a.resourceId);
    return await db.resources.where('id').anyOf(resourceIds).toArray();
}

export async function getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]> {
    const associations = await db.courseResources.where('courseId').equals(courseId).toArray();
    return associations.map(a => a.resourceId);
}

// --- Announcement Functions ---

export async function addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newAnnouncement: Announcement = {
        ...announcement,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    }
    return await db.announcements.add(newAnnouncement);
}

export async function deleteAnnouncement(id: number): Promise<void> {
    await db.announcements.delete(id);
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
    return await db.announcements.reverse().sortBy('timestamp');
}

export async function getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]> {
    const all = await db.announcements.reverse().sortBy('timestamp');
    return all.filter(a => 
        a.channels.includes('Todos') || 
        a.channels.includes(user.role) || 
        a.channels.includes(user.department)
    );
}

// --- Chat Functions ---

export async function addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newChatMessage: ChatMessage = {
        ...message,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    }
    await db.chatChannels.update(message.channelId, { updatedAt: new Date().toISOString() });
    return await db.chatMessages.add(newChatMessage);
}

export async function getChatMessages(channelId: string): Promise<ChatMessage[]> {
    return await db.chatMessages.where('channelId').equals(channelId).sortBy('timestamp');
}

export async function getPublicChatChannels(): Promise<ChatChannel[]> {
    return await db.chatChannels.where('type').equals('public').sortBy('name');
}

export async function getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]> {
    const threads = await db.chatChannels.where('participantIds').equals(userId).toArray();
    const otherParticipantIds = threads.flatMap(t => t.participantIds!.filter(pid => pid !== userId));
    
    if (otherParticipantIds.length === 0) return [];
    
    const otherParticipants = await db.users.where('id').anyOf(otherParticipantIds).toArray();
    const participantsMap = new Map(otherParticipants.map(u => [u.id, u]));

    return threads.map(thread => {
        const otherId = thread.participantIds!.find(pid => pid !== userId)!;
        const otherUser = participantsMap.get(otherId);
        return {
            ...thread,
            otherParticipant: otherUser ? {
                id: otherUser.id,
                name: otherUser.name,
                avatar: otherUser.avatar,
            } : {
                id: 'unknown',
                name: 'Usuario Desconocido',
                avatar: ''
            }
        };
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function getOrCreateDirectMessageThread(currentUserId: string, otherUserId: string): Promise<ChatChannel> {
    const threadId = `dm_${[currentUserId, otherUserId].sort().join('_')}`;
    const existingThread = await db.chatChannels.get(threadId);
        
    if (existingThread) {
        return existingThread;
    }
    
    const currentUser = await db.users.get(currentUserId);
    const otherUser = await db.users.get(otherUserId);

    if (!currentUser || !otherUser) {
        throw new Error("Uno o ambos usuarios no existen.");
    }
    
    const newChannel: ChatChannel = {
        id: threadId,
        name: `${currentUser.name} & ${otherUser.name}`,
        type: 'private',
        participantIds: [currentUserId, otherUserId],
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    
    await db.chatChannels.add(newChannel);
    return newChannel;
}


// --- Compliance and Mandatory Courses ---

export async function getComplianceReportData(departmentFilter: string = 'all', roleFilter: string = 'all'): Promise<ComplianceReportData[]> {
    let query = db.users.toCollection();

    if (departmentFilter !== 'all') {
        query = query.filter(u => u.department === departmentFilter);
    }
    if (roleFilter !== 'all') {
        query = query.filter(u => u.role === roleFilter);
    }

    const usersToReport = await query.toArray();
    const userIds = usersToReport.map(u => u.id);

    const allCourses = await db.courses.toArray();
    const allProgress = await db.userProgress.where('userId').anyOf(userIds).toArray();
    
    const progressMap = new Map<string, UserProgress>();
    allProgress.forEach(p => {
        const key = `${p.userId}-${p.courseId}`;
        progressMap.set(key, p);
    });

    const report: ComplianceReportData[] = [];

    for (const user of usersToReport) {
        const mandatoryCourses = allCourses.filter(c => c.mandatoryForRoles?.includes(user.role));
        if (mandatoryCourses.length === 0) {
            report.push({
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                mandatoryCoursesCount: 0,
                completedCoursesCount: 0,
                complianceRate: 100,
            });
            continue;
        }

        let completedCount = 0;
        for (const course of mandatoryCourses) {
            const progress = progressMap.get(`${user.id}-${course.id}`);
            if (progress && course.modules && course.modules.length > 0 && progress.completedModules.length === course.modules.length) {
                completedCount++;
            }
        }
        
        report.push({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            mandatoryCoursesCount: mandatoryCourses.length,
            completedCoursesCount: completedCount,
            complianceRate: (completedCount / mandatoryCourses.length) * 100,
        });
    }

    return report.sort((a,b) => a.complianceRate - b.complianceRate);
}

// --- Calendar Event Functions ---

export async function getAllCalendarEvents(): Promise<CalendarEvent[]> {
  return await db.calendarEvents.toArray();
}

export async function getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]> {
    if (courseIds.length === 0) return [];
    return await db.calendarEvents.where('courseId').anyOf(courseIds).toArray();
}

export async function addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newEvent: CalendarEvent = {
        ...event,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.calendarEvents.add(newEvent);
}

export async function updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number> {
    return await db.calendarEvents.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function deleteCalendarEvent(id: number): Promise<void> {
    await db.calendarEvents.delete(id);
}

// --- External Training Functions ---

export async function getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]> {
    return await db.externalTrainings.where('userId').equals(userId).reverse().sortBy('endDate');
}

export async function addExternalTraining(training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newTraining: ExternalTraining = {
        ...training,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.externalTrainings.add(newTraining);
}

export async function updateExternalTraining(id: number, data: Partial<Omit<ExternalTraining, 'id'>>): Promise<number> {
    return await db.externalTrainings.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function deleteExternalTraining(id: number): Promise<void> {
    await db.externalTrainings.delete(id);
}


// --- Cost Functions ---

export async function getAllCosts(): Promise<Cost[]> {
    return await db.costs.reverse().sortBy('date');
}

export async function addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newCost: Cost = {
        ...cost,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.costs.add(newCost);
}

export async function updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number> {
    return await db.costs.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function deleteCost(id: number): Promise<void> {
    await db.costs.delete(id);
}

export async function getAllCostCategories(): Promise<CustomCostCategory[]> {
    return await db.costCategories.toArray();
}

export async function addCostCategory(category: { name: string }): Promise<number> {
    return await db.costCategories.add(category);
}

export async function deleteCostCategory(id: number): Promise<void> {
    await db.costCategories.delete(id);
}


// --- Instructor Functions ---

export async function getCoursesByInstructorName(instructorName: string): Promise<Course[]> {
    return await db.courses.where('instructor').equals(instructorName).toArray();
}

export async function getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]> {
    const enrollments = await db.enrollments.where({ courseId }).filter(e => e.status === 'approved' || e.status === 'active').toArray();
    const studentIds = enrollments.map(e => e.studentId);

    if (studentIds.length === 0) return [];

    const students = await db.users.where('id').anyOf(studentIds).toArray();
    const progresses = await db.userProgress.where('courseId').equals(courseId).and(p => studentIds.includes(p.userId)).toArray();
    const course = await db.courses.get(courseId);

    const moduleCount = course?.modules?.length || 0;
    const progressMap = new Map(progresses.map(p => [p.userId, p]));
    const enrollmentMap = new Map(enrollments.map(e => [e.studentId, e]));

    return students.map(student => {
        const progress = progressMap.get(student.id);
        const completedModules = progress?.completedModules?.length || 0;
        const progressPercentage = moduleCount > 0 ? Math.round((completedModules / moduleCount) * 100) : 0;
        const enrollmentStatus = enrollmentMap.get(student.id)?.status || 'active';

        return {
            id: student.id,
            name: student.name,
            avatar: student.avatar,
            email: student.email,
            progress: progressPercentage,
            status: enrollmentStatus,
        };
    }).sort((a, b) => a.name.localeCompare(b.name));
}

// --- Gamification Functions ---

export async function getAllBadges(): Promise<Badge[]> {
    return await db.badges.toArray();
}

export async function getBadgesForUser(userId: string): Promise<UserBadge[]> {
    return await db.userBadges.where('userId').equals(userId).toArray();
}

export async function awardBadge(userId: string, badgeId: string): Promise<void> {
    return db.transaction('rw', db.userBadges, db.notifications, async () => {
        const existing = await db.userBadges.where({ userId, badgeId }).first();
        if (existing) {
            return;
        }

        await db.userBadges.add({
            userId,
            badgeId,
            earnedAt: new Date().toISOString(),
            isSynced: false,
            updatedAt: new Date().toISOString()
        });

        const badge = await db.badges.get(badgeId);
        if(badge) {
            await addNotification({
                userId: userId,
                message: `¡Insignia desbloqueada: ${badge.name}!`,
                type: 'badge_unlocked',
                relatedUrl: '/dashboard/settings',
                isRead: false,
                timestamp: new Date().toISOString(),
            });
        }
    });
}

async function checkAndAwardModuleBadges(userId: string) {
    const allProgress = await db.userProgress.where('userId').equals(userId).toArray();
    const totalModulesCompleted = allProgress.reduce((sum, p) => sum + p.completedModules.length, 0);

    if (totalModulesCompleted >= 1) await awardBadge(userId, 'first_module');
    if (totalModulesCompleted >= 5) await awardBadge(userId, '5_modules');
    if (totalModulesCompleted >= 15) await awardBadge(userId, 'maestro_del_saber');
}

async function handleCourseCompletion(userId: string, courseId: string) {
    return db.transaction('rw', db.users, db.enrollments, db.userLearningPathProgress, db.courses, db.badges, db.userBadges, db.notifications, async () => {
        const course = await db.courses.get(courseId);
        if (!course) return;

        const enrollment = await db.enrollments.where({ studentId: userId, courseId }).first();
        if (enrollment && enrollment.status !== 'completed') {
            await db.enrollments.update(enrollment.id!, { status: 'completed', updatedAt: new Date().toISOString() });
        }
        
        const user = await db.users.get(userId);
        if(user) {
            let pointsToAdd = 50;
            if (course.endDate && new Date() < new Date(course.endDate)) {
                pointsToAdd += 25;
                await awardBadge(userId, 'on_time_completion');
            }
            await db.users.update(userId, { points: (user.points || 0) + pointsToAdd });
        }
        
        const allCompletedEnrollments = await db.enrollments.where({ studentId: userId, status: 'completed' }).toArray();
        if (allCompletedEnrollments.length >= 1) await awardBadge(userId, 'first_course');
        if (allCompletedEnrollments.length >= 3) await awardBadge(userId, '3_courses');
        
        const allLearningPaths = await db.learningPaths.toArray();
        const relevantPaths = allLearningPaths.filter(p => p.courseIds.includes(courseId));
        
        for (const path of relevantPaths) {
            let progress = await db.userLearningPathProgress.where({ userId, learningPathId: path.id! }).first();
            if (progress) {
                const completed = new Set(progress.completedCourseIds);
                completed.add(courseId);
                await db.userLearningPathProgress.update(progress.id!, { completedCourseIds: Array.from(completed) });
            } else {
                await db.userLearningPathProgress.add({
                    userId,
                    learningPathId: path.id!,
                    completedCourseIds: [courseId],
                    isSynced: false,
                    updatedAt: new Date().toISOString()
                });
            }
        }
    });
}


// --- AI Configuration Functions ---

export async function getAIConfig(): Promise<AIConfig> {
    const config = await db.aiConfig.get('singleton');
    return config || defaultAIConfig;
}

export async function saveAIConfig(config: AIConfig): Promise<string> {
    return await db.aiConfig.put(config, 'singleton');
}

export async function logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number> {
    const newLog: AIUsageLog = {
        ...log,
        timestamp: new Date().toISOString()
    };
    return await db.aiUsageLog.add(newLog);
}


// --- Learning Path Functions ---

export async function getAllLearningPaths(): Promise<LearningPath[]> {
    return await db.learningPaths.reverse().sortBy('title');
}

export async function getLearningPathById(id: number): Promise<LearningPath | undefined> {
    return await db.learningPaths.get(id);
}

export async function addLearningPath(path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    return await db.learningPaths.add({
        ...path,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    });
}

export async function updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number> {
    return await db.learningPaths.update(id, { ...data, isSynced: false, updatedAt: new Date().toISOString() });
}

export async function deleteLearningPath(id: number): Promise<void> {
    await db.transaction('rw', db.learningPaths, db.userLearningPathProgress, async () => {
        await db.userLearningPathProgress.where('learningPathId').equals(id).delete();
        await db.learningPaths.delete(id);
    });
}

export async function getLearningPathsForUser(user: User): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]> {
    const paths = await db.learningPaths.where('targetRole').equals(user.role).toArray();
    const pathIds = paths.map(p => p.id!);
    
    if (pathIds.length === 0) return [];
    
    const progresses = await db.userLearningPathProgress.where('userId').equals(user.id).and(p => pathIds.includes(p.learningPathId)).toArray();
    const progressMap = new Map(progresses.map(p => [p.learningPathId, p]));
    
    return paths.map(path => ({
        ...path,
        progress: progressMap.get(path.id!)
    }));
}


// --- Course Rating Functions ---

export async function addCourseRating(rating: Omit<CourseRating, 'id'>): Promise<number> {
    const newRating: CourseRating = {
        ...rating,
        isPublic: false,
    }
    return await db.courseRatings.add(newRating);
}

export async function getRatingByUserAndCourse(userId: string, courseId: string): Promise<CourseRating | undefined> {
    return await db.courseRatings.where({ userId, courseId }).first();
}

export async function getRatingsForCourse(courseId: string): Promise<CourseRating[]> {
    return await db.courseRatings.where('courseId').equals(courseId).reverse().sortBy('timestamp');
}

export async function getRatingsForInstructor(instructorName: string): Promise<CourseRating[]> {
    return await db.courseRatings.where('instructorName').equals(instructorName).toArray();
}

export async function toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number> {
    return await db.courseRatings.update(ratingId, { isPublic });
}

// --- Permission Functions ---

export async function getPermissionsForRole(role: Role): Promise<string[]> {
    const perm = await db.rolePermissions.get(role);
    if (perm) {
        return perm.visibleNavs;
    }
    // Fallback to default if not found in DB
    return getNavItems()
        .filter(item => item.roles.includes(role))
        .map(item => item.href);
}

export async function updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number> {
    return await db.rolePermissions.put({ role, visibleNavs });
}

// --- System Log Functions ---

export async function logSystemEvent(level: LogLevel, message: string, details?: Record<string, any>): Promise<void> {
    try {
        await db.systemLogs.add({
            timestamp: new Date().toISOString(),
            level,
            message,
            details,
        });
    } catch (error) {
        console.error("Failed to write to system log:", error);
    }
}

export async function getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]> {
    if (filterLevel) {
        return await db.systemLogs.where('level').equals(filterLevel).reverse().sortBy('timestamp');
    }
    return await db.systemLogs.reverse().sortBy('timestamp');
}

export async function clearAllSystemLogs(): Promise<void> {
    await db.systemLogs.clear();
}
