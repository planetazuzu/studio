


import Dexie, { type Table } from 'dexie';
import type { Course, User, Enrollment, UserProgress, PendingEnrollmentDetails, ForumMessage, ForumMessageWithReplies, Notification, Resource, CourseResource, Announcement, ChatChannel, ChatMessage, Role, ComplianceReportData, DirectMessageThread, CalendarEvent, ExternalTraining, EnrollmentStatus, EnrollmentWithDetails, Cost, StudentForManagement, AIConfig, AIUsageLog, Badge, UserBadge, UserStatus } from './types';
import { courses as initialCourses, users as initialUsers, initialChatChannels, initialCosts, defaultAIConfig, roles, departments, initialBadges } from './data';

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


  constructor() {
    super('AcademiaAIDB');
    this.version(1).stores({
      courses: 'id, isSynced',
      users: 'id, email, isSynced',
      enrollments: '++id, studentId, courseId, status, isSynced',
      userProgress: '++id, [userId+courseId], progress, isSynced',
    });
    this.version(2).stores({
      users: 'id, &email, isSynced', // Email is now a unique index
    });
     this.version(3).stores({
      // Remove old progress table definition if structure changes
      userProgress: '++id, [userId+courseId], userId, courseId',
    });
    this.version(4).stores({
      forumMessages: '++id, courseId, parentId, timestamp',
    });
    this.version(5).stores({
        notifications: '++id, userId, isRead, timestamp',
    });
    this.version(6).stores({
        resources: '++id, name',
        courseResources: '++id, [courseId+resourceId]',
    });
    this.version(7).stores({
        announcements: '++id, timestamp',
    });
    this.version(8).stores({
        chatChannels: 'id, name',
        chatMessages: '++id, channelId, timestamp'
    });
    this.version(9).stores({
        courses: 'id, isSynced, *mandatoryForRoles'
    });
    this.version(10).stores({
        courses: 'id, status, isSynced, *mandatoryForRoles'
    });
    this.version(11).stores({
        chatChannels: 'id, name, type, *participantIds'
    });
    this.version(12).stores({
        calendarEvents: '++id, courseId, start, end, isSynced',
    });
    this.version(13).stores({
        externalTrainings: '++id, userId'
    });
    this.version(14).stores({
        enrollments: '++id, studentId, courseId, status'
    });
    this.version(15).stores({
        costs: '++id, category, courseId, date'
    });
    this.version(16).stores({
      courses: 'id, instructor, status, isSynced, *mandatoryForRoles'
    });
    this.version(17).stores({
        aiConfig: 'id',
        aiUsageLog: '++id, timestamp'
    });
    this.version(18).stores({
        users: 'id, &email, status, isSynced',
    });
    this.version(19).stores({
        users: 'id, &email, points, isSynced',
        badges: 'id',
        userBadges: '++id, [userId+badgeId]'
    });
    // Remove the status-related fields from the users table definition
    this.version(20).stores({
        users: 'id, &email, points, isSynced',
    });
    this.version(21).stores({
        users: 'id, &email, status, points, isSynced',
    });
    this.version(22).stores({
      courses: 'id, instructor, status, isScorm, isSynced, *mandatoryForRoles'
    });
    this.version(23).stores({
      // Optimization: Add compound indexes for faster queries
      enrollments: '++id, studentId, courseId, status, [studentId+status]',
      chatMessages: '++id, channelId, timestamp, [channelId+timestamp]',
      notifications: '++id, userId, isRead, timestamp, [userId+timestamp]',
    });
    this.version(24).stores({
        // Dexie supports blobs out of the box, no explicit schema change needed for `scormPackage`
        // Bumping version ensures schema is re-evaluated if needed.
        courses: 'id, instructor, status, isScorm, isSynced, *mandatoryForRoles'
    });
  }
}

export const db = new AcademiaAIDB();

// --- Database Population ---

export async function populateDatabase() {
  const adminUser = await db.users.get('user_1');

  // If the main admin user doesn't exist, or their status is incorrect, we assume the DB is stale.
  // We'll reset it to a known good state to ensure test accounts are always available.
  if (!adminUser || adminUser.status !== 'approved') {
    console.warn("Main admin user not found or has incorrect status. Resetting and populating database with initial data...");
    
    // Clear all tables to ensure a clean slate
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
    ]);

    console.log("Tables cleared. Repopulating with initial data...");

    // Repopulate with initial data
    await db.courses.bulkAdd(initialCourses.map(c => ({...c, isSynced: true})));
    await db.users.bulkAdd(initialUsers.map(u => ({...u, isSynced: true})));
    await db.chatChannels.bulkAdd(initialChatChannels);
    await db.costs.bulkAdd(initialCosts.map(c => ({...c, isSynced: true})));
    await db.aiConfig.add(defaultAIConfig);
    await db.badges.bulkAdd(initialBadges);

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
    if (user.status !== 'approved') {
        throw new Error('Esta cuenta ha sido desactivada. Contacta con un administrador.');
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
export async function addUser(user: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status'>): Promise<string> {
    const existingUser = await db.users.where('email').equalsIgnoreCase(user.email).first();
    if (existingUser) {
        throw new Error('Este correo electrónico ya está registrado.');
    }
    
    const newUser: User = {
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}`,
        status: 'approved',
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

export async function bulkAddUsers(users: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status'>[]): Promise<string[]> {
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
    // Find all courses that are mandatory for the user's role and are published.
    const allCourses = await db.courses.toArray();
    const mandatoryCourses = allCourses.filter(c => 
        c.status === 'published' && c.mandatoryForRoles?.includes(user.role)
    );

    if (mandatoryCourses.length === 0) {
        return [];
    }

    // Get all progress records for the user.
    const userProgressRecords = await db.userProgress.where('userId').equals(user.id).toArray();
    const progressMap = new Map(userProgressRecords.map(p => [p.courseId, p]));

    // Filter to find which mandatory courses are not yet completed.
    const incompleteCourses = mandatoryCourses.filter(course => {
        const progress = progressMap.get(course.id);
        
        // A course is considered complete if it has modules and all are marked as complete.
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
    const existingProgress = await db.userProgress.where({ userId, courseId }).first();
    const user = await db.users.get(userId);

    if (!user) return;

    if (existingProgress) {
        // Add moduleId to the set to avoid duplicates
        const completed = new Set(existingProgress.completedModules);
        if (completed.has(moduleId)) return; // Already completed, do nothing.

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

    // Award points
    await db.users.update(userId, { points: (user.points || 0) + 10 });
    
    // Check for badges
    await checkAndAwardModuleBadges(userId);

    const course = await db.courses.get(courseId);
    const updatedProgress = await db.userProgress.where({ userId, courseId }).first();
    if(course && updatedProgress && course.modules && updatedProgress.completedModules.length === course.modules.length) {
        await checkAndAwardCourseCompletionBadges(userId);
    }
}

// --- Forum Functions ---

export async function addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newMessage: ForumMessage = {
        ...message,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    }
    return await db.forumMessages.add(newMessage);
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

    // --- External Notification Simulation ---
    const user = await db.users.get(notification.userId);
    if (user && user.notificationSettings?.consent) {
        const settings = user.notificationSettings;
        const subject = `Notificación de EmergenciaAI`; // Generic subject
        
        if (settings.channels.includes('email')) {
            console.log(`[EMAIL SIMULATION] To: ${user.email}, Subject: "${subject}", Body: "${notification.message}"`);
        }
        if (settings.channels.includes('whatsapp')) {
             console.log(`[WHATSAPP SIMULATION] To: ${user.name}, Message: "${notification.message}"`);
        }
    }
    // --- END ---
    
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

// Gets all announcements for management view
export async function getAllAnnouncements(): Promise<Announcement[]> {
    return await db.announcements.reverse().sortBy('timestamp');
}

// Gets announcements relevant to a specific user
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
    // Update channel's updatedAt timestamp to sort DMs by recent activity
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
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')); // Sort by most recent activity
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

// Optimization: This function is now more efficient.
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
                complianceRate: 100, // No mandatory courses means 100% compliant
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
    // Check if user already has the badge
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
}

async function checkAndAwardModuleBadges(userId: string) {
    const allProgress = await db.userProgress.where('userId').equals(userId).toArray();
    const totalModulesCompleted = allProgress.reduce((sum, p) => sum + p.completedModules.length, 0);

    if (totalModulesCompleted >= 1) await awardBadge(userId, 'first_module');
    if (totalModulesCompleted >= 5) await awardBadge(userId, '5_modules');
    if (totalModulesCompleted >= 15) await awardBadge(userId, '15_modules');
}

async function checkAndAwardCourseCompletionBadges(userId: string) {
    const completedCoursesCount = await db.enrollments.where({ studentId: userId, status: 'completed' }).count();

    // Note: The status is updated *after* progress hits 100%. So we check for count + 1.
    if (completedCoursesCount + 1 >= 1) await awardBadge(userId, 'first_course');
    if (completedCoursesCount + 1 >= 3) await awardBadge(userId, '3_courses');

    // Here we would also update the enrollment status to 'completed'
    // This logic needs to be called from a place that knows the courseId.
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

    
