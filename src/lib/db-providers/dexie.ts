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
    this.version(32).stores({
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

const dbInstance = new AcademiaAIDB();

// --- DEXIE PROVIDER IMPLEMENTATION ---

export const dexieProvider: DBProvider = {
  db: dbInstance,
  
  async populateDatabase() {
      const adminUser = await dbInstance.users.get('user_1');

    if (!adminUser || adminUser.status !== 'approved') {
        console.warn("Main admin user not found or has incorrect status. Resetting and populating database with initial data...");
        
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
  },

  async login(email: string, password?: string): Promise<User | null> {
    const user = await this.db.users.where('email').equalsIgnoreCase(email).first();
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
  },

  logout(): void {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  },

  async getLoggedInUser(): Promise<User | null> {
    const userId = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (!userId) return null;
    const user = await this.db.users.get(userId);
    return user || null;
  },

  async addUser(user: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>): Promise<User> {
    const existingUser = await this.db.users.where('email').equalsIgnoreCase(user.email).first();
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
    await this.db.transaction('rw', this.db.users, this.db.learningPaths, this.db.userLearningPathProgress, async () => {
        await this.db.users.add(newUser);
        if (newUser.status === 'approved') {
            const pathForRole = await this.db.learningPaths.where('targetRole').equals(user.role).first();
            if (pathForRole?.id) {
                await this.db.userLearningPathProgress.add({
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
    return this.db.transaction('rw', this.db.users, this.db.learningPaths, this.db.userLearningPathProgress, async () => {
        const userIds = await this.db.users.bulkAdd(newUsers, { allKeys: true }) as string[];
        const allPaths = await this.db.learningPaths.toArray();
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
            await this.db.userLearningPathProgress.bulkAdd(progressToAdd);
        }
        return userIds;
    });
  },

  async getAllUsers(): Promise<User[]> {
    return await this.db.users.toArray();
  },

  async getUserById(id: string): Promise<User | undefined> {
    return await this.db.users.get(id);
  },

  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'isSynced' | 'password'>>): Promise<number> {
    const currentUser = await this.db.users.get(id);
    if (!currentUser) return 0;
    const roleIsChanging = data.role && currentUser.role !== data.role;
    return this.db.transaction('rw', this.db.users, this.db.learningPaths, this.db.userLearningPathProgress, async () => {
        const result = await this.db.users.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
        if (roleIsChanging) {
            const pathForNewRole = await this.db.learningPaths.where('targetRole').equals(data.role!).first();
            if (pathForNewRole?.id) {
                const existingProgress = await this.db.userLearningPathProgress.where({ userId: id, learningPathId: pathForNewRole.id }).first();
                if (!existingProgress) {
                    await this.db.userLearningPathProgress.add({
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
    const user = await this.db.users.get(userId);
    if (!user) return 0;
    return this.db.transaction('rw', this.db.users, this.db.learningPaths, this.db.userLearningPathProgress, this.db.notifications, async () => {
        const result = await this.db.users.update(userId, { status, updatedAt: new Date().toISOString(), isSynced: false });
        if (status === 'approved' && user.status === 'pending_approval') {
            const pathForRole = await this.db.learningPaths.where('targetRole').equals(user.role).first();
            if (pathForRole?.id) {
                const existingProgress = await this.db.userLearningPathProgress.where({ userId: user.id, learningPathId: pathForRole.id }).first();
                if (!existingProgress) {
                    await this.db.userLearningPathProgress.add({
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
    return await this.db.users.update(userId, { fcmToken, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async deleteUser(id: string): Promise<void> {
    await this.db.users.delete(id);
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
    return await this.db.courses.add(newCourse);
  },

  async getAllCourses(): Promise<Course[]> {
    return await this.db.courses.toArray();
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    return await this.db.courses.get(id);
  },

  async updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number> {
    return await this.db.courses.update(id, { ...data, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number> {
    return await this.db.courses.update(id, { status, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async deleteCourse(id: string): Promise<void> {
    return this.db.transaction('rw', this.db.courses, this.db.enrollments, this.db.userProgress, async () => {
        await this.db.enrollments.where('courseId').equals(id).delete();
        await this.db.userProgress.where('courseId').equals(id).delete();
        await this.db.courses.delete(id);
    });
  },

  async requestEnrollment(courseId: string, studentId: string): Promise<number> {
    const course = await this.db.courses.get(courseId);
    if (!course) throw new Error("El curso no existe.");
    const activeEnrollmentStatuses: EnrollmentStatus[] = ['pending', 'approved', 'active', 'waitlisted', 'needs_review', 'completed'];
    const existingEnrollment = await this.db.enrollments.where({ studentId, courseId }).filter(e => activeEnrollmentStatuses.includes(e.status)).first();
    if(existingEnrollment) throw new Error("Ya tienes una solicitud para este curso.");
    if (course.capacity !== undefined && course.capacity > 0) {
        const approvedCount = await this.getApprovedEnrollmentCount(courseId);
        if (approvedCount >= course.capacity) throw new Error("El curso está completo. No quedan plazas disponibles.");
    }
    const newEnrollment: Enrollment = {
        studentId, courseId, requestDate: new Date().toISOString(), status: 'pending', isSynced: false, updatedAt: new Date().toISOString(),
    };
    return await this.db.enrollments.add(newEnrollment);
  },

  async getApprovedEnrollmentCount(courseId: string): Promise<number> {
    return await this.db.enrollments.where({ courseId }).and(e => e.status === 'approved' || e.status === 'active' || e.status === 'completed').count();
  },

  async getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]> {
    const pendingEnrollments = await this.db.enrollments.where('status').equals('pending').toArray();
    if (pendingEnrollments.length === 0) return [];
    const userIds = [...new Set(pendingEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(pendingEnrollments.map(e => e.courseId))];
    const users = await this.db.users.where('id').anyOf(userIds).toArray();
    const courses = await this.db.courses.where('id').anyOf(courseIds).toArray();
    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    return pendingEnrollments.map(e => ({
        ...e,
        userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
    }));
  },

  async getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]> {
    const allEnrollments = await this.db.enrollments.toArray();
    if (allEnrollments.length === 0) return [];
    const userIds = [...new Set(allEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(allEnrollments.map(e => e.courseId))];
    const users = await this.db.users.where('id').anyOf(userIds).toArray();
    const courses = await this.db.courses.where('id').anyOf(courseIds).toArray();
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
    const studentEnrollments = await this.db.enrollments.where('studentId').equals(userId).toArray();
    if (studentEnrollments.length === 0) return [];
    const courseIds = [...new Set(studentEnrollments.map(e => e.courseId))];
    const courses = await this.db.courses.where('id').anyOf(courseIds).toArray();
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const user = await this.db.users.get(userId);
    return studentEnrollments.map(e => ({
        ...e,
        userName: user?.name || 'Usuario desconocido',
        userEmail: user?.email || 'Email desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
        courseImage: courseMap.get(e.courseId)?.image || '/images/courses/default.png',
    })).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  },

  async updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number> {
    const enrollment = await this.db.enrollments.get(enrollmentId);
    if (!enrollment) return 0;
    const result = await this.db.enrollments.update(enrollmentId, { status, justification, updatedAt: new Date().toISOString(), isSynced: false });
    if (status === 'approved') {
        const course = await this.db.courses.get(enrollment.courseId);
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
                await this.db.enrollments.update(enrollmentId, { status: 'active' });
            }
        }
    }
    return result;
  },

  async getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
    const approvedEnrollments = await this.db.enrollments.where('studentId').equals(userId).filter(e => e.status === 'approved' || e.status === 'active').toArray();
    if (approvedEnrollments.length === 0) return [];
    const courseIds = approvedEnrollments.map(e => e.courseId);
    return await this.db.courses.where('id').anyOf(courseIds).and(course => course.status !== 'draft').toArray();
  },

  async getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]> {
    const allCourses = await this.db.courses.toArray();
    const mandatoryCourses = allCourses.filter(c => c.status === 'published' && c.mandatoryForRoles?.includes(user.role));
    if (mandatoryCourses.length === 0) return [];
    const userProgressRecords = await this.db.userProgress.where('userId').equals(user.id).toArray();
    const progressMap = new Map(userProgressRecords.map(p => [p.courseId, p]));
    return mandatoryCourses.filter(course => {
        const progress = progressMap.get(course.id);
        const isCompleted = progress && course.modules && course.modules.length > 0 && progress.completedModules.length === course.modules.length;
        return !isCompleted;
    });
  },

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    return await this.db.userProgress.where({ userId, courseId }).first();
  },

  async getUserProgressForUser(userId: string): Promise<UserProgress[]> {
    return await this.db.userProgress.where({ userId }).toArray();
  },

  async markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void> {
    return this.db.transaction('rw', this.db.users, this.db.userProgress, this.db.badges, this.db.userBadges, this.db.notifications, this.db.courses, this.db.enrollments, this.db.learningPaths, this.db.userLearningPathProgress, async () => {
        const existingProgress = await this.getUserProgress(userId, courseId);
        const user = await this.getUserById(userId);
        if (!user) return;
        if (existingProgress) {
            const completed = new Set(existingProgress.completedModules);
            if (completed.has(moduleId)) return;
            completed.add(moduleId);
            await this.db.userProgress.update(existingProgress.id!, { completedModules: Array.from(completed), updatedAt: new Date().toISOString(), isSynced: false });
        } else {
            await this.db.userProgress.add({ userId, courseId, completedModules: [moduleId], updatedAt: new Date().toISOString(), isSynced: false });
        }
        await this.db.users.update(userId, { points: (user.points || 0) + 10 });
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
    const newId = await this.db.forumMessages.add(newMessage);
    await this.db.transaction('rw', this.db.users, this.db.forumMessages, this.db.userBadges, this.db.notifications, async () => {
        const user = await this.db.users.get(message.userId);
        if (!user) return;
        const pointsToAdd = message.parentId ? 2 : 5;
        await this.db.users.update(user.id, { points: (user.points || 0) + pointsToAdd });
        const userMessageCount = await this.db.forumMessages.where('userId').equals(user.id).count();
        if (userMessageCount === 1) await this.awardBadge(user.id, 'forum_first_post');
        if (userMessageCount === 5) await this.awardBadge(user.id, 'forum_collaborator');
    });
    return newId;
  },

  async getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]> {
    const messages = await this.db.forumMessages.where('courseId').equals(courseId).sortBy('timestamp');
    const messageMap = new Map<number, ForumMessageWithReplies>();
    const rootMessages: ForumMessageWithReplies[] = [];
    messages.forEach(msg => messageMap.set(msg.id!, { ...msg, replies: [] }));
    messages.forEach(msg => {
        if (msg.parentId && messageMap.has(msg.parentId)) {
            messageMap.get(msg.parentId)!.replies.push(messageMap.get(msg.id!)!);
        } else {
            rootMessages.push(messageMap.get(msg.id!)!);
        }
    });
    return rootMessages.reverse();
  },

  async deleteForumMessage(messageId: number): Promise<void> {
    return this.db.transaction('rw', this.db.forumMessages, async () => {
        const messagesToDelete: number[] = [messageId];
        const queue: number[] = [messageId];
        while (queue.length > 0) {
            const parentId = queue.shift()!;
            const children = await this.db.forumMessages.where('parentId').equals(parentId).toArray();
            for (const child of children) {
                messagesToDelete.push(child.id!);
                queue.push(child.id!);
            }
        }
        await this.db.forumMessages.bulkDelete(messagesToDelete);
    });
  },

  async addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newNotification: Notification = { ...notification, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await this.db.notifications.add(newNotification);
    const user = await this.db.users.get(notification.userId);
    if (user && user.notificationSettings?.consent) {
        const settings = user.notificationSettings;
        const subject = `Notificación de TalentOS: ${notification.type.replace(/_/g, ' ')}`;
        const body = notification.message;
        if (settings.channels.includes('email')) sendEmailNotification(user, subject, body).catch(e => this.logSystemEvent('ERROR', 'Failed to send email notification', { error: e.message, userId: user.id }));
        if (settings.channels.includes('whatsapp') && user.phone) sendWhatsAppNotification(user, body).catch(e => this.logSystemEvent('ERROR', 'Failed to send WhatsApp notification', { error: e.message, userId: user.id }));
        if (settings.channels.includes('app') && user.fcmToken) {
            const title = 'Nueva Notificación de TalentOS';
            sendPushNotification(user.id, title, body, notification.relatedUrl || '/dashboard').catch(e => this.logSystemEvent('ERROR', 'Failed to send Push notification', { error: e.message, userId: user.id }));
        }
    }
    return newId;
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await this.db.notifications.where({ userId }).reverse().sortBy('timestamp');
  },

  async markNotificationAsRead(notificationId: number): Promise<number> {
    return await this.db.notifications.update(notificationId, { isRead: true, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const unreadNotifications = await this.db.notifications.where({ userId, isRead: false }).toArray();
    if (unreadNotifications.length > 0) {
        const idsToUpdate = unreadNotifications.map(n => n.id!);
        await this.db.notifications.bulkUpdate(idsToUpdate.map(id => ({ key: id, changes: { isRead: true, updatedAt: new Date().toISOString(), isSynced: false } })));
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
                const existingReminder = await this.db.notifications.where({ userId: user.id }).filter(notif => notif.type === 'course_deadline_reminder' && notif.relatedUrl === `/dashboard/courses/${course.id}`).first();
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
    return await this.db.resources.add(newResource);
  },

  async getAllResources(): Promise<Resource[]> {
    return await this.db.resources.orderBy('name').toArray();
  },

  async deleteResource(resourceId: number): Promise<void> {
    return this.db.transaction('rw', this.db.resources, this.db.courseResources, async () => {
        await this.db.courseResources.where('resourceId').equals(resourceId).delete();
        await this.db.resources.delete(resourceId);
    });
  },

  async associateResourceWithCourse(courseId: string, resourceId: number): Promise<void> {
    const existing = await this.db.courseResources.where({ courseId, resourceId }).first();
    if (!existing) await this.db.courseResources.add({ courseId, resourceId });
  },

  async dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void> {
    await this.db.courseResources.where({ courseId, resourceId }).delete();
  },

  async getResourcesForCourse(courseId: string): Promise<Resource[]> {
    const associations = await this.db.courseResources.where('courseId').equals(courseId).toArray();
    if (associations.length === 0) return [];
    const resourceIds = associations.map(a => a.resourceId);
    return await this.db.resources.where('id').anyOf(resourceIds).toArray();
  },

  async getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]> {
    const associations = await this.db.courseResources.where('courseId').equals(courseId).toArray();
    return associations.map(a => a.resourceId);
  },

  async addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newAnnouncement: Announcement = { ...announcement, isSynced: false, updatedAt: new Date().toISOString() };
    return await this.db.announcements.add(newAnnouncement);
  },

  async deleteAnnouncement(id: number): Promise<void> {
    await this.db.announcements.delete(id);
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await this.db.announcements.reverse().sortBy('timestamp');
  },

  async getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]> {
    const all = await this.db.announcements.reverse().sortBy('timestamp');
    return all.filter(a => a.channels.includes('Todos') || a.channels.includes(user.role) || a.channels.includes(user.department));
  },

  async addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newChatMessage: ChatMessage = { ...message, isSynced: false, updatedAt: new Date().toISOString() };
    await this.db.chatChannels.update(message.channelId, { updatedAt: new Date().toISOString() });
    return await this.db.chatMessages.add(newChatMessage);
  },

  async getChatMessages(channelId: string): Promise<ChatMessage[]> {
    return await this.db.chatMessages.where('channelId').equals(channelId).sortBy('timestamp');
  },

  async getPublicChatChannels(): Promise<ChatChannel[]> {
    return await this.db.chatChannels.where('type').equals('public').sortBy('name');
  },

  async addPublicChatChannel(name: string, description: string): Promise<number> {
    const newChannel: ChatChannel = { id: `channel_${name.toLowerCase().replace(/\s+/g, '-')}`, name, description, type: 'public', isSynced: false, updatedAt: new Date().toISOString() };
    return await this.db.chatChannels.add(newChannel);
  },

  async getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]> {
    const threads = await this.db.chatChannels.where('participantIds').equals(userId).toArray();
    const otherParticipantIds = threads.flatMap(t => t.participantIds!.filter(pid => pid !== userId));
    if (otherParticipantIds.length === 0) return [];
    const otherParticipants = await this.db.users.where('id').anyOf(otherParticipantIds).toArray();
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
    const existingThread = await this.db.chatChannels.get(threadId);
    if (existingThread) return existingThread;
    const currentUser = await this.db.users.get(currentUserId);
    const otherUser = await this.db.users.get(otherUserId);
    if (!currentUser || !otherUser) throw new Error("Uno o ambos usuarios no existen.");
    const newChannel: ChatChannel = { id: threadId, name: `${currentUser.name} & ${otherUser.name}`, type: 'private', participantIds: [currentUserId, otherUserId], isSynced: false, updatedAt: new Date().toISOString() };
    await this.db.chatChannels.add(newChannel);
    return newChannel;
  },

  async getComplianceReportData(departmentFilter: string = 'all', roleFilter: string = 'all'): Promise<ComplianceReportData[]> {
    let query = this.db.users.toCollection();
    if (departmentFilter !== 'all') query = query.filter(u => u.department === departmentFilter);
    if (roleFilter !== 'all') query = query.filter(u => u.role === roleFilter);
    const usersToReport = await query.toArray();
    const userIds = usersToReport.map(u => u.id);
    const allCourses = await this.db.courses.toArray();
    const allProgress = await this.db.userProgress.where('userId').anyOf(userIds).toArray();
    const progressMap = new Map<string, UserProgress>();
    allProgress.forEach(p => progressMap.set(`${p.userId}-${p.courseId}`, p));
    const report: ComplianceReportData[] = [];
    for (const user of usersToReport) {
        const mandatoryCourses = allCourses.filter(c => c.mandatoryForRoles?.includes(user.role));
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
    return await this.db.calendarEvents.toArray();
  },

  async getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]> {
    if (courseIds.length === 0) return [];
    return await this.db.calendarEvents.where('courseId').anyOf(courseIds).toArray();
  },

  async addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newEvent: CalendarEvent = { ...event, isSynced: false, updatedAt: new Date().toISOString() };
    return await this.db.calendarEvents.add(newEvent);
  },

  async updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number> {
    return await this.db.calendarEvents.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async deleteCalendarEvent(id: number): Promise<void> {
    await this.db.calendarEvents.delete(id);
  },

  async getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]> {
    return await this.db.externalTrainings.where('userId').equals(userId).reverse().sortBy('endDate');
  },

  async addExternalTraining(training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newTraining: ExternalTraining = { ...training, isSynced: false, updatedAt: new Date().toISOString() };
    return await this.db.externalTrainings.add(newTraining);
  },

  async updateExternalTraining(id: number, data: Partial<Omit<ExternalTraining, 'id'>>): Promise<number> {
    return await this.db.externalTrainings.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async deleteExternalTraining(id: number): Promise<void> {
    await this.db.externalTrainings.delete(id);
  },

  async getAllCosts(): Promise<Cost[]> {
    return await this.db.costs.reverse().sortBy('date');
  },

  async addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newCost: Cost = { ...cost, isSynced: false, updatedAt: new Date().toISOString() };
    return await this.db.costs.add(newCost);
  },

  async updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number> {
    return await this.db.costs.update(id, { ...data, updatedAt: new Date().toISOString(), isSynced: false });
  },

  async deleteCost(id: number): Promise<void> {
    await this.db.costs.delete(id);
  },

  async getAllCostCategories(): Promise<CustomCostCategory[]> {
    return await this.db.costCategories.toArray();
  },

  async addCostCategory(category: { name: string }): Promise<number> {
    return await this.db.costCategories.add(category);
  },

  async deleteCostCategory(id: number): Promise<void> {
    await this.db.costCategories.delete(id);
  },

  async getCoursesByInstructorName(instructorName: string): Promise<Course[]> {
    return await this.db.courses.where('instructor').equals(instructorName).toArray();
  },

  async getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]> {
    const enrollments = await this.db.enrollments.where({ courseId }).filter(e => e.status === 'approved' || e.status === 'active').toArray();
    const studentIds = enrollments.map(e => e.studentId);
    if (studentIds.length === 0) return [];
    const students = await this.db.users.where('id').anyOf(studentIds).toArray();
    const progresses = await this.db.userProgress.where('courseId').equals(courseId).and(p => studentIds.includes(p.userId)).toArray();
    const course = await this.db.courses.get(courseId);
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
    return await this.db.badges.toArray();
  },

  async getBadgesForUser(userId: string): Promise<UserBadge[]> {
    return await this.db.userBadges.where('userId').equals(userId).toArray();
  },

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    return this.db.transaction('rw', this.db.userBadges, this.db.notifications, async () => {
        const existing = await this.db.userBadges.where({ userId, badgeId }).first();
        if (existing) return;
        await this.db.userBadges.add({ userId, badgeId, earnedAt: new Date().toISOString(), isSynced: false, updatedAt: new Date().toISOString() });
        const badge = await this.db.badges.get(badgeId);
        if(badge) {
            await this.addNotification({ userId: userId, message: `¡Insignia desbloqueada: ${badge.name}!`, type: 'badge_unlocked', relatedUrl: '/dashboard/settings', isRead: false, timestamp: new Date().toISOString() });
        }
    });
  },

  async getAIConfig(): Promise<AIConfig> {
    const config = await this.db.aiConfig.get('singleton');
    return config || defaultAIConfig;
  },

  async saveAIConfig(config: AIConfig): Promise<string> {
    return await this.db.aiConfig.put(config, 'singleton');
  },

  async logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number> {
    const newLog: AIUsageLog = { ...log, timestamp: new Date().toISOString() };
    return await this.db.aiUsageLog.add(newLog);
  },

  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await this.db.learningPaths.reverse().sortBy('title');
  },

  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    return await this.db.learningPaths.get(id);
  },

  async addLearningPath(path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    return await this.db.learningPaths.add({ ...path, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number> {
    return await this.db.learningPaths.update(id, { ...data, isSynced: false, updatedAt: new Date().toISOString() });
  },

  async deleteLearningPath(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.learningPaths, this.db.userLearningPathProgress, async () => {
        await this.db.userLearningPathProgress.where('learningPathId').equals(id).delete();
        await this.db.learningPaths.delete(id);
    });
  },

  async getLearningPathsForUser(user: User): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]> {
    const paths = await this.db.learningPaths.where('targetRole').equals(user.role).toArray();
    const pathIds = paths.map(p => p.id!);
    if (pathIds.length === 0) return [];
    const progresses = await this.db.userLearningPathProgress.where('userId').equals(user.id).and(p => pathIds.includes(p.learningPathId)).toArray();
    const progressMap = new Map(progresses.map(p => [p.learningPathId, p]));
    return paths.map(path => ({ ...path, progress: progressMap.get(path.id!) }));
  },

  async addCourseRating(rating: Omit<CourseRating, 'id'>): Promise<number> {
    const newRating: CourseRating = { ...rating, isPublic: false };
    return await this.db.courseRatings.add(newRating);
  },

  async getRatingByUserAndCourse(userId: string, courseId: string): Promise<CourseRating | undefined> {
    return await this.db.courseRatings.where({ userId, courseId }).first();
  },

  async getRatingsForCourse(courseId: string): Promise<CourseRating[]> {
    return await this.db.courseRatings.where('courseId').equals(courseId).reverse().sortBy('timestamp');
  },

  async getRatingsForInstructor(instructorName: string): Promise<CourseRating[]> {
    return await this.db.courseRatings.where('instructorName').equals(instructorName).toArray();
  },

  async toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number> {
    return await this.db.courseRatings.update(ratingId, { isPublic });
  },

  async getPermissionsForRole(role: Role): Promise<string[]> {
    const perm = await this.db.rolePermissions.get(role);
    if (perm) return perm.visibleNavs;
    return getNavItems().filter(item => item.roles.includes(role)).map(item => item.href);
  },

  async updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number> {
    return await this.db.rolePermissions.put({ role, visibleNavs });
  },

  async logSystemEvent(level: LogLevel, message: string, details?: Record<string, any>): Promise<void> {
    try {
        await this.db.systemLogs.add({ timestamp: new Date().toISOString(), level, message, details });
    } catch (error) {
        console.error("Failed to write to system log:", error);
    }
  },

  async getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]> {
    if (filterLevel) return await this.db.systemLogs.where('level').equals(filterLevel).reverse().sortBy('timestamp');
    return await this.db.systemLogs.reverse().sortBy('timestamp');
  },

  async clearAllSystemLogs(): Promise<void> {
    await this.db.systemLogs.clear();
  },

  // Internal helper methods, prefixed with _ to avoid exposing them on the provider interface.
  async _checkAndAwardModuleBadges(userId: string) {
    const allProgress = await this.db.userProgress.where('userId').equals(userId).toArray();
    const totalModulesCompleted = allProgress.reduce((sum, p) => sum + p.completedModules.length, 0);
    if (totalModulesCompleted >= 1) await this.awardBadge(userId, 'first_module');
    if (totalModulesCompleted >= 5) await this.awardBadge(userId, '5_modules');
    if (totalModulesCompleted >= 15) await this.awardBadge(userId, 'maestro_del_saber');
  },

  async _handleCourseCompletion(userId: string, courseId: string) {
    return this.db.transaction('rw', this.db.users, this.db.enrollments, this.db.userLearningPathProgress, this.db.courses, this.db.badges, this.db.userBadges, this.db.notifications, async () => {
        const course = await this.db.courses.get(courseId);
        if (!course) return;
        const enrollment = await this.db.enrollments.where({ studentId: userId, courseId }).first();
        if (enrollment && enrollment.status !== 'completed') await this.db.enrollments.update(enrollment.id!, { status: 'completed', updatedAt: new Date().toISOString() });
        const user = await this.db.users.get(userId);
        if(user) {
            let pointsToAdd = 50;
            if (course.endDate && new Date() < new Date(course.endDate)) {
                pointsToAdd += 25;
                await this.awardBadge(userId, 'on_time_completion');
            }
            await this.db.users.update(userId, { points: (user.points || 0) + pointsToAdd });
        }
        const allCompletedEnrollments = await this.db.enrollments.where({ studentId: userId, status: 'completed' }).toArray();
        if (allCompletedEnrollments.length >= 1) await this.awardBadge(userId, 'first_course');
        if (allCompletedEnrollments.length >= 3) await this.awardBadge(userId, '3_courses');
        const allLearningPaths = await this.db.learningPaths.toArray();
        const relevantPaths = allLearningPaths.filter(p => p.courseIds.includes(courseId));
        for (const path of relevantPaths) {
            let progress = await this.db.userLearningPathProgress.where({ userId, learningPathId: path.id! }).first();
            if (progress) {
                const completed = new Set(progress.completedCourseIds);
                completed.add(courseId);
                await this.db.userLearningPathProgress.update(progress.id!, { completedCourseIds: Array.from(completed) });
            } else {
                await this.db.userLearningPathProgress.add({ userId, learningPathId: path.id!, completedCourseIds: [courseId], isSynced: false, updatedAt: new Date().toISOString() });
            }
        }
    });
  },
};
