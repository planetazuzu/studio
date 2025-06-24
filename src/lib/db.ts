import Dexie, { type Table } from 'dexie';
import type { Course, User, Enrollment, UserProgress, PendingEnrollmentDetails, ForumMessage, ForumMessageWithReplies, Notification, Resource, CourseResource, Announcement, ChatChannel, ChatMessage, Role, ComplianceReportData } from './types';
import { courses as initialCourses, users as initialUsers, initialChatChannels } from './data';

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
  }
}

export const db = new AcademiaAIDB();

// --- Database Population ---

export async function populateDatabase() {
  const userCount = await db.users.count();
  if (userCount === 0) {
    console.log("Populating database with initial data...");
    await db.courses.bulkAdd(initialCourses.map(c => ({...c, isSynced: true})));
    try {
        await db.users.bulkAdd(initialUsers.map(u => ({...u, isSynced: true})));
    } catch(e) {
        console.error("Failed to bulk add users, maybe duplicates in data.ts", e);
    }
  }

  const channelCount = await db.chatChannels.count();
  if (channelCount === 0) {
    console.log("Populating chat channels...");
    await db.chatChannels.bulkAdd(initialChatChannels);
  }
}

// --- Authentication Functions ---

export async function login(email: string, password?: string): Promise<User | null> {
    const user = await db.users.where('email').equalsIgnoreCase(email).first();
    if (user && user.password === password) {
        localStorage.setItem(LOGGED_IN_USER_KEY, user.id);
        return user;
    }
    return null;
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
export async function addUser(user: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings'>): Promise<string> {
    const newUser: User = {
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}`,
        isSynced: false,
        updatedAt: new Date().toISOString(),
        notificationSettings: {
            courseReminders: true,
            newCourses: true,
            feedbackReady: true,
        },
    };
    return await db.users.add(newUser);
}

export async function bulkAddUsers(users: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings'>[]): Promise<string[]> {
    const newUsers: User[] = users.map(user => ({
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}${Math.random()}`,
        isSynced: false,
        updatedAt: new Date().toISOString(),
        notificationSettings: {
            courseReminders: true,
            newCourses: true,
            feedbackReady: true,
        },
    }));
    // The 'allKeys' option returns the primary keys of all added objects.
    // Dexie's bulkAdd is atomic, so if one fails (e.g., duplicate email), all will be rolled back.
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

export async function deleteUser(id: string): Promise<void> {
    await db.users.delete(id);
    // In a real-world app, you might want to delete related data here as well,
    // such as enrollments and progress, within a transaction.
}


// --- Data Access Functions ---

export async function addCourse(course: Omit<Course, 'id' | 'modules' | 'status' | 'isSynced' | 'updatedAt'>) {
  const newCourse: Course = {
    ...course,
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    modules: [], // Start with no modules, they can be added later
    status: 'draft',
    mandatoryForRoles: course.mandatoryForRoles || [],
    isSynced: false,
    updatedAt: new Date().toISOString(),
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

export async function updateEnrollmentStatus(enrollmentId: number, studentId: string, courseId: string, status: 'approved' | 'rejected'): Promise<number> {
    const result = await db.enrollments.update(enrollmentId, { status, updatedAt: new Date().toISOString(), isSynced: false });

    if (status === 'approved') {
        const course = await db.courses.get(courseId);
        if (course) {
            await addNotification({
                userId: studentId,
                message: `Tu inscripción a "${course.title}" ha sido aprobada.`,
                type: 'enrollment_approved',
                relatedUrl: `/dashboard/courses/${courseId}`,
                isRead: false,
                timestamp: new Date().toISOString(),
            });
        }
    }
    return result;
}

export async function getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
  const approvedEnrollments = await db.enrollments
    .where({ studentId: userId, status: 'approved' })
    .toArray();
  
  if (approvedEnrollments.length === 0) return [];

  const courseIds = approvedEnrollments.map(e => e.courseId);
  
  const enrolledCourses = await db.courses.where('id').anyOf(courseIds).and(course => course.status === 'published').toArray();

  return enrolledCourses;
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

    if (existingProgress) {
        // Add moduleId to the set to avoid duplicates
        const completed = new Set(existingProgress.completedModules);
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
    return await db.notifications.add(newNotification);
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
    return await db.chatMessages.add(newChatMessage);
}

export async function getChatMessages(channelId: string): Promise<ChatMessage[]> {
    return await db.chatMessages.where('channelId').equals(channelId).sortBy('timestamp');
}

export async function getAllChatChannels(): Promise<ChatChannel[]> {
    return await db.chatChannels.orderBy('name').toArray();
}


// --- Compliance and Mandatory Courses ---

export async function getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]> {
    const mandatoryCourses = await db.courses.where('mandatoryForRoles').equals(user.role).toArray();
    if (mandatoryCourses.length === 0) return [];

    const progressData = await getUserProgressForUser(user.id);
    const progressMap = new Map(progressData.map(p => [p.courseId, p]));

    const incompleteCourses = mandatoryCourses.filter(course => {
        const progress = progressMap.get(course.id);
        const moduleCount = course.modules?.length || 0;
        if (!progress || moduleCount === 0) {
            return true; // No progress or no modules means incomplete
        }
        return progress.completedModules.length < moduleCount;
    });

    return incompleteCourses;
}

export async function getComplianceReportData(): Promise<ComplianceReportData[]> {
    const allUsers = await db.users.toArray();
    const allCourses = await db.courses.toArray();
    const allProgress = await db.userProgress.toArray();

    const progressMap = new Map<string, UserProgress>();
    allProgress.forEach(p => {
        const key = `${p.userId}-${p.courseId}`;
        progressMap.set(key, p);
    });

    const report: ComplianceReportData[] = [];

    for (const user of allUsers) {
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
            if (progress && course.modules.length > 0 && progress.completedModules.length === course.modules.length) {
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
