// src/lib/db-providers/dexie.ts

/**
 * This is the Dexie implementation of the DBProvider interface.
 * All data access logic for the application when using the local
 * IndexedDB is contained within this file.
 */

import Dexie, { type Table } from 'dexie';
import type { Course, User, Enrollment, UserProgress, PendingEnrollmentDetails, ForumMessage, ForumMessageWithReplies, Notification, Resource, CourseResource, Announcement, ChatChannel, ChatMessage, Role, ComplianceReportData, DirectMessageThread, CalendarEvent, ExternalTraining, EnrollmentStatus, EnrollmentWithDetails, Cost, StudentForManagement, AIConfig, AIUsageLog, Badge, UserBadge, UserStatus, CustomCostCategory, LearningPath, UserLearningPathProgress, CourseRating, RolePermission, SystemLog, LogLevel } from '@/lib/types';
import { courses as initialCourses, users as initialUsers, initialChatChannels, initialCosts, defaultAIConfig, roles, departments, initialBadges, initialCostCategories } from '@/lib/data';
import { sendEmailNotification, sendPushNotification, sendWhatsAppNotification } from '@/lib/notification-service';
import { getNavItems } from '@/lib/nav';
import { differenceInDays, isAfter } from 'date-fns';
import type { DBProvider } from './types';


const LOGGED_IN_USER_KEY = 'loggedInUserId';

// --- DEXIE DATABASE DEFINITION ---
class AcademiaAIDB extends Dexie {
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
    this.version(33).stores({
      courses: 'id, instructor, status, isScorm, isSynced, *mandatoryForRoles',
      users: 'id, &email, status, points, isSynced',
      enrollments: '++id, studentId, courseId, status, [studentId+status]',
      userProgress: '++id, [userId+courseId], userId, courseId',
      forumMessages: '++id, courseId, parentId, timestamp',
      notifications: '++id, userId, isRead, timestamp, [userId+timestamp], [userId+type+relatedUrl]',
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

const dbInstance = new AcademiaAIDB();

// Populate the database if it's empty
dbInstance.on('populate', async () => {
    console.log("Database is being populated for the first time.");
    await populateDatabase();
});

// --- Population Logic (extracted to be called by 'populate' event) ---
async function populateDatabase() {
    console.warn("Populating database with initial data...");
    
    await Promise.all([
    dbInstance.courses.clear(),
    dbInstance.users.clear(),
    dbInstance.enrollments.clear(),
    dbInstance.userProgress.clear(),
    dbInstance.forumMessages.clear(),
    dbInstance.notifications.clear(),
    dbInstance.resources.clear(),
    dbInstance.courseResources.clear(),
    dbInstance.announcements.clear(),
    dbInstance.chatChannels.clear(),
    dbInstance.chatMessages.clear(),
    dbInstance.calendarEvents.clear(),
    dbInstance.externalTrainings.clear(),
    dbInstance.costs.clear(),
    dbInstance.aiConfig.clear(),
    dbInstance.aiUsageLog.clear(),
    dbInstance.badges.clear(),
    dbInstance.userBadges.clear(),
    dbInstance.costCategories.clear(),
    dbInstance.learningPaths.clear(),
    dbInstance.userLearningPathProgress.clear(),
    dbInstance.courseRatings.clear(),
    dbInstance.rolePermissions.clear(),
    dbInstance.systemLogs.clear(),
    ]);

    console.log("Tables cleared. Repopulating with initial data...");

    const initialPermissions: RolePermission[] = roles.map(role => {
        const visibleNavs = getNavItems()
            .filter(item => item.roles.includes(role))
            .map(item => item.href);
        return { role, visibleNavs };
    });

    await dbInstance.courses.bulkAdd(initialCourses.map(c => ({...c, isSynced: true})));
    await dbInstance.users.bulkAdd(initialUsers.map(u => ({...u, isSynced: true})));
    await dbInstance.chatChannels.bulkAdd(initialChatChannels);
    await dbInstance.costs.bulkAdd(initialCosts.map(c => ({...c, isSynced: true})));
    await dbInstance.aiConfig.add(defaultAIConfig);
    await dbInstance.badges.bulkAdd(initialBadges);
    await dbInstance.costCategories.bulkAdd(initialCostCategories.map(name => ({ name })));
    await dbInstance.rolePermissions.bulkAdd(initialPermissions);

    console.log("Database population complete.");
}


// --- DEXIE PROVIDER IMPLEMENTATION ---

export const dexieProvider: DBProvider = {
  db: dbInstance,
  
  // This is a placeholder now, as the on('populate') event handles the real work.
  // We keep it in the interface for potential future manual-repopulation features.
  async populateDatabase() {
    console.log("Manual population trigger called, but Dexie's 'populate' event handles the initial setup.");
    // We can manually trigger a repopulation if needed by calling the standalone function
    // await populateDatabase();
  },

  async login(email: string, password?: string): Promise<User | null> {
    const user = await dbInstance.users.where('email').equalsIgnoreCase(email).first();
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
    
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOGGED_IN_USER_KEY, user.id);
    }
    return user;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOGGED_IN_USER_KEY);
    }
  },

  async getLoggedInUser(): Promise<User | null> {
    if (typeof window === 'undefined') {
      return null; // Avoid accessing localStorage on the server
    }
    const userId = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (!userId) return null;
    const user = await dbInstance.users.get(userId);
    return user || null;
  },

  async addUser(user: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>): Promise<User> {
    const existingUser = await dbInstance.users.where('email').equalsIgnoreCase(user.email).first();
    if (existingUser) {
        throw new Error('Este correo electrónico ya está en uso.');
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
        notificationSettings: { consent: false, channels: [] },
    };
    await dbInstance.transaction('rw', dbInstance.users, dbInstance.learningPaths, dbInstance.userLearningPathProgress, async () => {
        await dbInstance.users.add(newUser);
        if (newUser.status === 'approved') {
            const pathForRole = await dbInstance.learningPaths.where('targetRole').equals(user.role).first();
            if (pathForRole?.id) {
                await dbInstance.userLearningPathProgress.add({
                    userId: newUser.id,
                    learningPathId: pathForRole.id,
                    completedCourseIds: [],
                    isSynced: false,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
    });
    return newUser;
  },

  async bulkAddUsers(users: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>[]): Promise<string[]> {
    const newUsers: User[] = users.map(user => ({
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}${Math.random()}`,
        status: 'approved',
        isSynced: false,
        points: 0,
        updatedAt: new Date().toISOString(),
        notificationSettings: { consent: false, channels: [] },
    }));
    return dbInstance.transaction('rw', dbInstance.users, dbInstance.learningPaths, dbInstance.userLearningPathProgress, async () => {
        const userIds = await dbInstance.users.bulkAdd(newUsers, { allKeys: true }) as string[];
        const allPaths = await dbInstance.learningPaths.toArray();
        const pathsByRole = new Map<Role, LearningPath>();
        allPaths.forEach(p => pathsByRole.set(p.targetRole, p));
        const progressToAdd: Omit<UserLearningPathProgress, 'id'>[] = [];
        newUsers.forEach(user => {
            const pathForRole = pathsByRole.get(user.role);
            if (pathForRole?.id) {
                progressToAdd.push({
                    userId: user.id,
                    learningPathId: pathForRole.id,
                    completedCourseIds: [],
                    isSynced: false,
                    updatedAt: new Date().toISOString(),
                });
            }
        });
        if (progressToAdd.length > 0) {
            await dbInstance.userLearningPathProgress.bulkAdd(progressToAdd);
        }
        return userIds;
    });
  },

  async getAllUsers(): Promise<User[]> {
    return await dbInstance.users.toArray();
  },

  async getUserById(id: string): Promise<User | undefined> {
    return await dbInstance.users.get(id);
  },

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'isSynced' | 'password'>>): Promise<number> {
    const currentUser = await dbInstance.users.get(id);
    if (!currentUser) return 0;
    const roleIsChanging = data.role && currentUser.role !== data.role;
    return dbInstance.transaction('rw', dbInstance.users, dbInstance.learningPaths, dbInstance.userLearningPathProgress, async () => {
        const result = await dbInstance.users.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
        if (roleIsChanging) {
            const pathForNewRole = await dbInstance.learningPaths.where('targetRole').equals(data.role!).first();
            if (pathForNewRole?.id) {
                const existingProgress = await dbInstance.userLearningPathProgress.where({ userId: id, learningPathId: pathForNewRole.id }).first();
                if (!existingProgress) {
                    await dbInstance.userLearningPathProgress.add({
                        userId: id,
                        learningPathId: pathForNewRole.id,
                        completedCourseIds: [],
                        isSynced: false,
                        updatedAt: new Date().toISOString(),
                    });
                }
            }
        }
        return result;
    });
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<number> {
    const user = await dbInstance.users.get(userId);
    if (!user) return 0;
    return dbInstance.transaction('rw', dbInstance.users, dbInstance.learningPaths, dbInstance.userLearningPathProgress, dbInstance.notifications, async () => {
        const result = await dbInstance.users.update(userId, { status, updatedAt: new Date().toISOString(), isSynced: false });
        if (status === 'approved' && user.status === 'pending_approval') {
            const pathForRole = await dbInstance.learningPaths.where('targetRole').equals(user.role).first();
            if (pathForRole?.id) {
                const existingProgress = await dbInstance.userLearningPathProgress.where({ userId: user.id, learningPathId: pathForRole.id }).first();
                if (!existingProgress) {
                    await dbInstance.userLearningPathProgress.add({
                        userId: user.id,
                        learningPathId: pathForRole.id,
                        completedCourseIds: [],
                        isSynced: false,
                        updatedAt: new Date().toISOString(),
                    });
                }
            }
            await this.addNotification({
                userId: user.id,
                message: `¡Tu cuenta ha sido aprobada! Ya puedes acceder a todas las funcionalidades de la plataforma.`,
                type: 'enrollment_approved',
                relatedUrl: `/dashboard`,
                isRead: false,
                timestamp: new Date().toISOString(),
            });
        }
        return result;
    });
  },

  async saveFcmToken(userId: string, fcmToken: string): Promise<number> {
    return await dbInstance.users.update(userId, { fcmToken, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async deleteUser(id: string): Promise<void> {
    await dbInstance.users.delete(id);
  },

  async addCourse(course: Partial<Omit<Course, 'id' | 'isSynced' | 'updatedAt'>>): Promise<string> {
    const newCourse: Course = {
        id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: course.title || 'Sin Título',
        description: course.description || '',
        longDescription: course.longDescription || '',
        instructor: course.instructor || 'Por definir',
        duration: course.duration || 'Por definir',
        modality: course.modality || 'Online',
        image: course.image || '/images/courses/default.png',
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
        ...(course.category && { category: course.category }),
        ...(course.capacity && { capacity: course.capacity }),
    };
    return await dbInstance.courses.add(newCourse);
  },

  async getAllCourses(): Promise<Course[]> {
    return await dbInstance.courses.toArray();
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    return await dbInstance.courses.get(id);
  },

  async updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number> {
    return await dbInstance.courses.update(id, { ...data, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number> {
    return await dbInstance.courses.update(id, { status, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async deleteCourse(id: string): Promise<void> {
    return dbInstance.transaction('rw', dbInstance.courses, dbInstance.enrollments, dbInstance.userProgress, async () => {
        await dbInstance.enrollments.where('courseId').equals(id).delete();
        await dbInstance.userProgress.where('courseId').equals(id).delete();
        await dbInstance.courses.delete(id);
    });
  },

  async requestEnrollment(courseId: string, studentId: string): Promise<number> {
    const course = await dbInstance.courses.get(courseId);
    if (!course) throw new Error("El curso no existe.");
    const activeEnrollmentStatuses: EnrollmentStatus[] = ['pending', 'approved', 'active', 'waitlisted', 'needs_review', 'completed'];
    const existingEnrollment = await dbInstance.enrollments.where({ studentId, courseId }).filter(e => activeEnrollmentStatuses.includes(e.status)).first();
    if(existingEnrollment) throw new Error("Ya tienes una solicitud para este curso.");
    if (course.capacity !== undefined && course.capacity > 0) {
        const approvedCount = await this.getApprovedEnrollmentCount(courseId);
        if (approvedCount >= course.capacity) throw new Error("El curso está completo. No quedan plazas disponibles.");
    }
    const newEnrollment: Enrollment = {
        studentId, courseId, requestDate: new Date().toISOString(), status: 'pending', isSynced: false, updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.enrollments.add(newEnrollment);
    return newId as number;
  },

  async getApprovedEnrollmentCount(courseId: string): Promise<number> {
    return await dbInstance.enrollments.where({ courseId }).and(e => e.status === 'approved' || e.status === 'active' || e.status === 'completed').count();
  },

  async getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]> {
    const pendingEnrollments = await dbInstance.enrollments.where('status').equals('pending').toArray();
    if (pendingEnrollments.length === 0) return [];
    const userIds = [...new Set(pendingEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(pendingEnrollments.map(e => e.courseId))];
    const users = await dbInstance.users.where('id').anyOf(userIds).toArray();
    const courses = await dbInstance.courses.where('id').anyOf(courseIds).toArray();
    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    return pendingEnrollments.map(e => ({
        ...e,
        userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
    }));
  },

  async getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]> {
    const allEnrollments = await dbInstance.enrollments.toArray();
    if (allEnrollments.length === 0) return [];
    const userIds = [...new Set(allEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(allEnrollments.map(e => e.courseId))];
    const users = await dbInstance.users.where('id').anyOf(userIds).toArray();
    const courses = await dbInstance.courses.where('id').anyOf(courseIds).toArray();
    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    return allEnrollments.map(e => ({
        ...e,
        userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
        userEmail: userMap.get(e.studentId)?.email || 'Email desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
        courseImage: courseMap.get(e.courseId)?.image || '/images/courses/default.png',
    }));
  },

  async getEnrollmentsForStudent(userId: string): Promise<EnrollmentWithDetails[]> {
    const studentEnrollments = await dbInstance.enrollments.where('studentId').equals(userId).toArray();
    if (studentEnrollments.length === 0) return [];
    const courseIds = [...new Set(studentEnrollments.map(e => e.courseId))];
    const courses = await dbInstance.courses.where('id').anyOf(courseIds).toArray();
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const user = await dbInstance.users.get(userId);
    return studentEnrollments.map(e => ({
        ...e,
        userName: user?.name || 'Usuario desconocido',
        userEmail: user?.email || 'Email desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
        courseImage: courseMap.get(e.courseId)?.image || '/images/courses/default.png',
    })).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  },

  async updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number> {
    const enrollment = await dbInstance.enrollments.get(enrollmentId);
    if (!enrollment) return 0;
    const result = await dbInstance.enrollments.update(enrollmentId, { status, justification, updatedAt: new Date().toISOString(), isSynced: false });
    if (status === 'approved') {
        const course = await dbInstance.courses.get(enrollment.courseId);
        if (course) {
            await this.addNotification({
                userId: enrollment.studentId,
                message: `Tu inscripción a "${course.title}" ha sido aprobada.`,
                type: 'enrollment_approved',
                relatedUrl: `/dashboard/courses/${enrollment.courseId}`,
                isRead: false,
                timestamp: new Date().toISOString(),
            });
            if (course.startDate && new Date(course.startDate) <= new Date()) {
                await dbInstance.enrollments.update(enrollmentId, { status: 'active' });
            }
        }
    }
    return result;
  },

  async getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
    const approvedEnrollments = await dbInstance.enrollments.where('studentId').equals(userId).filter(e => e.status === 'approved' || e.status === 'active').toArray();
    if (approvedEnrollments.length === 0) return [];
    const courseIds = approvedEnrollments.map(e => e.courseId);
    return await dbInstance.courses.where('id').anyOf(courseIds).and(course => course.status !== 'draft').toArray();
  },

  async getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]> {
    const allCourses = await dbInstance.courses.toArray();
    const mandatoryCourses = allCourses.filter(c => c.status === 'published' && c.mandatoryForRoles?.includes(user.role));
    if (mandatoryCourses.length === 0) return [];
    const userProgressRecords = await dbInstance.userProgress.where('userId').equals(user.id).toArray();
    const progressMap = new Map(userProgressRecords.map(p => [p.courseId, p]));
    return mandatoryCourses.filter(course => {
        const progress = progressMap.get(course.id);
        const isCompleted = progress && course.modules && course.modules.length > 0 && progress.completedModules.length === course.modules.length;
        return !isCompleted;
    });
  },

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    return await dbInstance.userProgress.where({ userId, courseId }).first();
  },

  async getUserProgressForUser(userId: string): Promise<UserProgress[]> {
    return await dbInstance.userProgress.where({ userId }).toArray();
  },

  async markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void> {
    return dbInstance.transaction('rw', dbInstance.users, dbInstance.userProgress, dbInstance.badges, dbInstance.userBadges, dbInstance.notifications, dbInstance.courses, dbInstance.enrollments, dbInstance.learningPaths, dbInstance.userLearningPathProgress, async () => {
        const existingProgress = await this.getUserProgress(userId, courseId);
        const user = await this.getUserById(userId);
        if (!user) return;
        if (existingProgress) {
            const completed = new Set(existingProgress.completedModules);
            if (completed.has(moduleId)) return;
            completed.add(moduleId);
            await dbInstance.userProgress.update(existingProgress.id!, { completedModules: Array.from(completed), updatedAt: new Date().toISOString(), isSynced: false });
        } else {
            await dbInstance.userProgress.add({ userId, courseId, completedModules: [moduleId], updatedAt: new Date().toISOString(), isSynced: false });
        }
        await dbInstance.users.update(userId, { points: (user.points || 0) + 10 });
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) await this.awardBadge(userId, 'weekend_warrior');
        await this._checkAndAwardModuleBadges(userId);
        const course = await this.getCourseById(courseId);
        const updatedProgress = await this.getUserProgress(userId, courseId);
        if(course && updatedProgress && course.modules && updatedProgress.completedModules.length === course.modules.length) {
            await this._handleCourseCompletion(userId, courseId);
        }
    });
  },

  async addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newMessage: ForumMessage = { ...message, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.forumMessages.add(newMessage);
    await dbInstance.transaction('rw', dbInstance.users, dbInstance.forumMessages, dbInstance.userBadges, dbInstance.notifications, async () => {
        const user = await dbInstance.users.get(message.userId);
        if (!user) return;
        const pointsToAdd = message.parentId ? 2 : 5;
        await dbInstance.users.update(user.id, { points: (user.points || 0) + pointsToAdd });
        const userMessageCount = await dbInstance.forumMessages.where('userId').equals(user.id).count();
        if (userMessageCount === 1) await this.awardBadge(user.id, 'forum_first_post');
        if (userMessageCount === 5) await this.awardBadge(user.id, 'forum_collaborator');
    });
    return newId as number;
  },

  async getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]> {
    const messages = await dbInstance.forumMessages.where('courseId').equals(courseId).sortBy('timestamp');
    const messageMap = new Map<number, ForumMessageWithReplies>();
    const rootMessages: ForumMessageWithReplies[] = [];
    messages.forEach(msg => {
      if(msg.id) messageMap.set(msg.id, { ...msg, replies: [] })
    });
    messages.forEach(msg => {
      if(msg.id) {
        if (msg.parentId && messageMap.has(msg.parentId)) {
            messageMap.get(msg.parentId)!.replies.push(messageMap.get(msg.id)!);
        } else {
            rootMessages.push(messageMap.get(msg.id)!);
        }
      }
    });
    return rootMessages.reverse();
  },

  async deleteForumMessage(messageId: number): Promise<void> {
    return dbInstance.transaction('rw', dbInstance.forumMessages, async () => {
        const messagesToDelete: number[] = [messageId];
        const queue: number[] = [messageId];
        while (queue.length > 0) {
            const parentId = queue.shift()!;
            const children = await dbInstance.forumMessages.where('parentId').equals(parentId).toArray();
            for (const child of children) {
                if(child.id) {
                  messagesToDelete.push(child.id);
                  queue.push(child.id);
                }
            }
        }
        await dbInstance.forumMessages.bulkDelete(messagesToDelete);
    });
  },

  async addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newNotification: Notification = { ...notification, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.notifications.add(newNotification);
    const user = await dbInstance.users.get(notification.userId);
    if (user && user.notificationSettings?.consent) {
        const settings = user.notificationSettings;
        const subject = `Notificación de TalentOS: ${notification.type.replace(/_/g, ' ')}`;
        const body = notification.message;
        if (settings.channels.includes('email')) sendEmailNotification(user, subject, body).catch(e => this.logSystemEvent('ERROR', 'Failed to send email notification', { error: (e as Error).message, userId: user.id }));
        if (settings.channels.includes('whatsapp') && user.phone) sendWhatsAppNotification(user, body).catch(e => this.logSystemEvent('ERROR', 'Failed to send WhatsApp notification', { error: (e as Error).message, userId: user.id }));
        if (settings.channels.includes('app') && user.fcmToken) {
            const title = 'Nueva Notificación de TalentOS';
            sendPushNotification(user.id, title, body, notification.relatedUrl || '/dashboard').catch(e => this.logSystemEvent('ERROR', 'Failed to send Push notification', { error: (e as Error).message, userId: user.id }));
        }
    }
    return newId as number;
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await dbInstance.notifications.where({ userId }).reverse().sortBy('timestamp');
  },

  async markNotificationAsRead(notificationId: number): Promise<number> {
    return await dbInstance.notifications.update(notificationId, { isRead: true, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const unreadNotifications = await dbInstance.notifications.where({ userId, isRead: false }).toArray();
    if (unreadNotifications.length > 0) {
        const idsToUpdate = unreadNotifications.map(n => n.id!);
        await dbInstance.notifications.bulkUpdate(idsToUpdate.map(id => ({ key: id, changes: { isRead: true, updatedAt: new Date().toISOString(), isSynced: false } })));
    }
  },

  async checkAndSendDeadlineReminders(user: User): Promise<void> {
    const enrolledCourses = await this.getEnrolledCoursesForUser(user.id);
    if (enrolledCourses.length === 0) return;
    const now = new Date();
    for (const course of enrolledCourses) {
        if (course.endDate) {
            const endDate = new Date(course.endDate);
            const daysUntilDeadline = differenceInDays(endDate, now);
            if (isAfter(endDate, now) && daysUntilDeadline <= 7) {
                const existingReminder = await dbInstance.notifications.where({ userId: user.id }).filter(notif => notif.type === 'course_deadline_reminder' && notif.relatedUrl === `/dashboard/courses/${course.id}`).first();
                if (!existingReminder) {
                    await this.addNotification({
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
  },

  async addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newResource: Resource = { ...resource, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.resources.add(newResource);
    return newId as number;
  },

  async getAllResources(): Promise<Resource[]> {
    return await dbInstance.resources.orderBy('name').toArray();
  },

  async deleteResource(resourceId: number): Promise<void> {
    return dbInstance.transaction('rw', dbInstance.resources, dbInstance.courseResources, async () => {
        await dbInstance.courseResources.where('resourceId').equals(resourceId).delete();
        await dbInstance.resources.delete(resourceId);
    });
  },

  async associateResourceWithCourse(courseId: string, resourceId: number): Promise<void> {
    const existing = await dbInstance.courseResources.where({ courseId, resourceId }).first();
    if (!existing) await dbInstance.courseResources.add({ courseId, resourceId });
  },

  async dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void> {
    await dbInstance.courseResources.where({ courseId, resourceId }).delete();
  },

  async getResourcesForCourse(courseId: string): Promise<Resource[]> {
    const associations = await dbInstance.courseResources.where('courseId').equals(courseId).toArray();
    if (associations.length === 0) return [];
    const resourceIds = associations.map(a => a.resourceId);
    return await dbInstance.resources.where('id').anyOf(resourceIds).toArray();
  },

  async getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]> {
    const associations = await dbInstance.courseResources.where('courseId').equals(courseId).toArray();
    return associations.map(a => a.resourceId);
  },

  async addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newAnnouncement: Announcement = { ...announcement, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.announcements.add(newAnnouncement);
    return newId as number;
  },

  async deleteAnnouncement(id: number): Promise<void> {
    await dbInstance.announcements.delete(id);
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await dbInstance.announcements.reverse().sortBy('timestamp');
  },

  async getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]> {
    const all = await dbInstance.announcements.reverse().sortBy('timestamp');
    return all.filter(a => a.channels.includes('Todos') || a.channels.includes(user.role) || a.channels.includes(user.department));
  },

  async addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newChatMessage: ChatMessage = { ...message, isSynced: false, updatedAt: new Date().toISOString() };
    await dbInstance.chatChannels.update(message.channelId, { updatedAt: new Date().toISOString() });
    const newId = await dbInstance.chatMessages.add(newChatMessage);
    return newId as number;
  },

  async getChatMessages(channelId: string): Promise<ChatMessage[]> {
    return await dbInstance.chatMessages.where('channelId').equals(channelId).sortBy('timestamp');
  },

  async getPublicChatChannels(): Promise<ChatChannel[]> {
    return await dbInstance.chatChannels.where('type').equals('public').sortBy('name');
  },

  async addPublicChatChannel(name: string, description: string): Promise<string> {
    const newChannel: ChatChannel = { id: `channel_${name.toLowerCase().replace(/\s+/g, '-')}`, name, description, type: 'public', isSynced: false, updatedAt: new Date().toISOString() };
    return await dbInstance.chatChannels.add(newChannel);
  },

  async getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]> {
    const threads = await dbInstance.chatChannels.where('participantIds').equals(userId).toArray();
    const otherParticipantIds = threads.flatMap(t => t.participantIds!.filter(pid => pid !== userId));
    if (otherParticipantIds.length === 0) return [];
    const otherParticipants = await dbInstance.users.where('id').anyOf(otherParticipantIds).toArray();
    const participantsMap = new Map(otherParticipants.map(u => [u.id, u]));
    return threads.map(thread => {
        const otherId = thread.participantIds!.find(pid => pid !== userId)!;
        const otherUser = participantsMap.get(otherId);
        return {
            ...thread,
            otherParticipant: otherUser ? { id: otherUser.id, name: otherUser.name, avatar: otherUser.avatar } : { id: 'unknown', name: 'Usuario Desconocido', avatar: '' }
        };
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  },

  async getOrCreateDirectMessageThread(currentUserId: string, otherUserId: string): Promise<ChatChannel> {
    const threadId = `dm_${[currentUserId, otherUserId].sort().join('_')}`;
    const existingThread = await dbInstance.chatChannels.get(threadId);
    if (existingThread) return existingThread;
    const currentUser = await dbInstance.users.get(currentUserId);
    const otherUser = await dbInstance.users.get(otherUserId);
    if (!currentUser || !otherUser) throw new Error("Uno o ambos usuarios no existen.");
    const newChannel: ChatChannel = { id: threadId, name: `${currentUser.name} & ${otherUser.name}`, type: 'private', participantIds: [currentUserId, otherUserId], isSynced: false, updatedAt: new Date().toISOString() };
    await dbInstance.chatChannels.add(newChannel);
    return newChannel;
  },

  async getComplianceReportData(departmentFilter: string = 'all', roleFilter: string = 'all'): Promise<ComplianceReportData[]> {
    let query = dbInstance.users.toCollection();
    if (departmentFilter !== 'all') query = query.filter(u => u.department === departmentFilter);
    if (roleFilter !== 'all') query = query.filter(u => u.role === roleFilter);
    const usersToReport = await query.toArray();
    const userIds = usersToReport.map(u => u.id);
    const allCourses = await dbInstance.courses.toArray();
    const allProgress = await dbInstance.userProgress.where('userId').anyOf(userIds).toArray();
    const progressMap = new Map<string, UserProgress>();
    allProgress.forEach(p => progressMap.set(`${p.userId}-${p.courseId}`, p));
    const report: ComplianceReportData[] = [];
    for (const user of usersToReport) {
        const mandatoryCourses = allCourses.filter(c => c.status === 'published' && c.mandatoryForRoles?.includes(user.role));
        if (mandatoryCourses.length === 0) {
            report.push({ userId: user.id, userName: user.name, userRole: user.role, mandatoryCoursesCount: 0, completedCoursesCount: 0, complianceRate: 100 });
            continue;
        }
        let completedCount = 0;
        for (const course of mandatoryCourses) {
            const progress = progressMap.get(`${user.id}-${course.id}`);
            if (progress && course.modules && course.modules.length > 0 && progress.completedModules.length === course.modules.length) completedCount++;
        }
        report.push({ userId: user.id, userName: user.name, userRole: user.role, mandatoryCoursesCount: mandatoryCourses.length, completedCoursesCount: completedCount, complianceRate: (completedCount / mandatoryCourses.length) * 100 });
    }
    return report.sort((a,b) => a.complianceRate - b.complianceRate);
  },

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return await dbInstance.calendarEvents.toArray();
  },

  async getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]> {
    if (courseIds.length === 0) return [];
    return await dbInstance.calendarEvents.where('courseId').anyOf(courseIds).toArray();
  },

  async addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newEvent: CalendarEvent = { ...event, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.calendarEvents.add(newEvent);
    return newId as number;
  },

  async updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number> {
    return await dbInstance.calendarEvents.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async deleteCalendarEvent(id: number): Promise<void> {
    await dbInstance.calendarEvents.delete(id);
  },

  async getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]> {
    return await dbInstance.externalTrainings.where('userId').equals(userId).reverse().sortBy('endDate');
  },

  async addExternalTraining(training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newTraining: ExternalTraining = { ...training, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.externalTrainings.add(newTraining);
    return newId as number;
  },

  async updateExternalTraining(id: number, data: Partial<Omit<ExternalTraining, 'id'>>): Promise<number> {
    return await dbInstance.externalTrainings.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async deleteExternalTraining(id: number): Promise<void> {
    await dbInstance.externalTrainings.delete(id);
  },

  async getAllCosts(): Promise<Cost[]> {
    return await dbInstance.costs.reverse().sortBy('date');
  },

  async addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newCost: Cost = { ...cost, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.costs.add(newCost);
    return newId as number;
  },

  async updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number> {
    return await dbInstance.costs.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async deleteCost(id: number): Promise<void> {
    await dbInstance.costs.delete(id);
  },

  async getAllCostCategories(): Promise<CustomCostCategory[]> {
    return await dbInstance.costCategories.toArray();
  },

  async addCostCategory(category: { name: string }): Promise<number> {
    const newId = await dbInstance.costCategories.add(category);
    return newId as number;
  },

  async deleteCostCategory(id: number): Promise<void> {
    await dbInstance.costCategories.delete(id);
  },

  async getCoursesByInstructorName(instructorName: string): Promise<Course[]> {
    return await dbInstance.courses.where('instructor').equals(instructorName).toArray();
  },

  async getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]> {
    const enrollments = await dbInstance.enrollments.where({ courseId }).filter(e => e.status === 'approved' || e.status === 'active').toArray();
    const studentIds = enrollments.map(e => e.studentId);
    if (studentIds.length === 0) return [];
    const students = await dbInstance.users.where('id').anyOf(studentIds).toArray();
    const progresses = await dbInstance.userProgress.where('courseId').equals(courseId).and(p => studentIds.includes(p.userId)).toArray();
    const course = await dbInstance.courses.get(courseId);
    const moduleCount = course?.modules?.length || 0;
    const progressMap = new Map(progresses.map(p => [p.userId, p]));
    const enrollmentMap = new Map(enrollments.map(e => [e.studentId, e]));
    return students.map(student => {
        const progress = progressMap.get(student.id);
        const completedModules = progress?.completedModules?.length || 0;
        const progressPercentage = moduleCount > 0 ? Math.round((completedModules / moduleCount) * 100) : 0;
        const enrollmentStatus = enrollmentMap.get(student.id)?.status || 'active';
        return { id: student.id, name: student.name, avatar: student.avatar, email: student.email, progress: progressPercentage, status: enrollmentStatus };
    }).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getAllBadges(): Promise<Badge[]> {
    return await dbInstance.badges.toArray();
  },

  async getBadgesForUser(userId: string): Promise<UserBadge[]> {
    return await dbInstance.userBadges.where('userId').equals(userId).toArray();
  },

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    return dbInstance.transaction('rw', dbInstance.userBadges, dbInstance.notifications, async () => {
        const existing = await dbInstance.userBadges.where({ userId, badgeId }).first();
        if (existing) return;
        await dbInstance.userBadges.add({ userId, badgeId, earnedAt: new Date().toISOString(), isSynced: false, updatedAt: new Date().toISOString() });
        const badge = await dbInstance.badges.get(badgeId);
        if(badge) {
            await this.addNotification({ userId: userId, message: `¡Insignia desbloqueada: ${badge.name}!`, type: 'badge_unlocked', relatedUrl: '/dashboard/profile', isRead: false, timestamp: new Date().toISOString() });
        }
    });
  },

  async getAIConfig(): Promise<AIConfig> {
    const config = await dbInstance.aiConfig.get('singleton');
    return config || defaultAIConfig;
  },

  async saveAIConfig(config: AIConfig): Promise<string> {
    return await dbInstance.aiConfig.put(config, 'singleton');
  },

  async logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number> {
    const newLog: AIUsageLog = { ...log, timestamp: new Date().toISOString() };
    const newId = await dbInstance.aiUsageLog.add(newLog);
    return newId as number;
  },

  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await dbInstance.learningPaths.reverse().sortBy('title');
  },

  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    return await dbInstance.learningPaths.get(id);
  },

  async addLearningPath(path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newId = await dbInstance.learningPaths.add({ ...path, isSynced: false, updatedAt: new Date().toISOString() });
    return newId as number;
  },

  async updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number> {
    return await dbInstance.learningPaths.update(id, { ...data, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async deleteLearningPath(id: number): Promise<void> {
    await dbInstance.transaction('rw', dbInstance.learningPaths, dbInstance.userLearningPathProgress, async () => {
        await dbInstance.userLearningPathProgress.where('learningPathId').equals(id).delete();
        await dbInstance.learningPaths.delete(id);
    });
  },

  async getLearningPathsForUser(user: User): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]> {
    const paths = await dbInstance.learningPaths.where('targetRole').equals(user.role).toArray();
    const pathIds = paths.map(p => p.id!);
    if (pathIds.length === 0) return [];
    const progresses = await dbInstance.userLearningPathProgress.where('userId').equals(user.id).and(p => pathIds.includes(p.learningPathId)).toArray();
    const progressMap = new Map(progresses.map(p => [p.learningPathId, p]));
    return paths.map(path => ({ ...path, progress: progressMap.get(path.id!) }));
  },

  async addCourseRating(rating: Omit<CourseRating, 'id' | 'isPublic'>): Promise<number> {
    const newRating: CourseRating = { ...rating, isPublic: false };
    const newId = await dbInstance.courseRatings.add(newRating);
    return newId as number;
  },

  async getRatingByUserAndCourse(userId: string, courseId: string): Promise<CourseRating | undefined> {
    return await dbInstance.courseRatings.where({ userId, courseId }).first();
  },

  async getRatingsForCourse(courseId: string): Promise<CourseRating[]> {
    return await dbInstance.courseRatings.where('courseId').equals(courseId).reverse().sortBy('timestamp');
  },

  async getRatingsForInstructor(instructorName: string): Promise<CourseRating[]> {
    return await dbInstance.courseRatings.where('instructorName').equals(instructorName).toArray();
  },

  async toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number> {
    return await dbInstance.courseRatings.update(ratingId, { isPublic });
  },

  async getPermissionsForRole(role: Role): Promise<string[]> {
    const perm = await dbInstance.rolePermissions.get(role);
    if (perm) return perm.visibleNavs;
    return getNavItems().filter(item => item.roles.includes(role)).map(item => item.href);
  },

  async updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number> {
    return await dbInstance.rolePermissions.put({ role, visibleNavs });
  },

  async logSystemEvent(level: LogLevel, message: string, details?: Record<string, any>): Promise<void> {
    try {
        await dbInstance.systemLogs.add({ timestamp: new Date().toISOString(), level, message, details });
    } catch (error) {
        console.error("Failed to write to system log:", error);
    }
  },

  async getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]> {
    if (filterLevel) return await dbInstance.systemLogs.where('level').equals(filterLevel).reverse().sortBy('timestamp');
    return await dbInstance.systemLogs.reverse().sortBy('timestamp');
  },

  async clearAllSystemLogs(): Promise<void> {
    await dbInstance.systemLogs.clear();
  },

  // Internal helper methods, prefixed with _ to avoid exposing them on the provider interface.
  async _checkAndAwardModuleBadges(userId: string) {
    const allProgress = await dbInstance.userProgress.where('userId').equals(userId).toArray();
    const totalModulesCompleted = allProgress.reduce((sum, p) => sum + p.completedModules.length, 0);
    if (totalModulesCompleted >= 1) await this.awardBadge(userId, 'first_module');
    if (totalModulesCompleted >= 5) await this.awardBadge(userId, '5_modules');
    if (totalModulesCompleted >= 15) await this.awardBadge(userId, 'maestro_del_saber');
  },

  async _handleCourseCompletion(userId: string, courseId: string) {
    return dbInstance.transaction('rw', dbInstance.users, dbInstance.enrollments, dbInstance.userLearningPathProgress, dbInstance.courses, dbInstance.badges, dbInstance.userBadges, dbInstance.notifications, async () => {
        const course = await dbInstance.courses.get(courseId);
        if (!course) return;
        const enrollment = await dbInstance.enrollments.where({ studentId: userId, courseId }).first();
        if (enrollment && enrollment.status !== 'completed') await dbInstance.enrollments.update(enrollment.id!, { status: 'completed', updatedAt: new Date().toISOString() });
        const user = await dbInstance.users.get(userId);
        if(user) {
            let pointsToAdd = 50;
            if (course.endDate && new Date() < new Date(course.endDate)) {
                pointsToAdd += 25;
                await this.awardBadge(userId, 'on_time_completion');
            }
            await dbInstance.users.update(userId, { points: (user.points || 0) + pointsToAdd });
        }
        const allCompletedEnrollments = await dbInstance.enrollments.where({ studentId: userId, status: 'completed' }).toArray();
        if (allCompletedEnrollments.length >= 1) await this.awardBadge(userId, 'first_course');
        if (allCompletedEnrollments.length >= 3) await this.awardBadge(userId, '3_courses');
        const allLearningPaths = await dbInstance.learningPaths.toArray();
        const relevantPaths = allLearningPaths.filter(p => p.courseIds.includes(courseId));
        for (const path of relevantPaths) {
            let progress = await dbInstance.userLearningPathProgress.where({ userId, learningPathId: path.id! }).first();
            if (progress) {
                const completed = new Set(progress.completedCourseIds);
                completed.add(courseId);
                await dbInstance.userLearningPathProgress.update(progress.id!, { completedCourseIds: Array.from(completed) });
            } else {
                await dbInstance.userLearningPathProgress.add({ userId, learningPathId: path.id!, completedCourseIds: [courseId], isSynced: false, updatedAt: new Date().toISOString() });
            }
        }
    });
  },
};

// Open the database. This will also trigger the 'populate' event if it's the first time.
dbInstance.open().catch(function (err) {
  console.error('Failed to open db: ' + (err.stack || err));
});
