import Dexie, { type Table } from 'dexie';
import type { Course, User, Enrollment, UserProgress, PendingEnrollmentDetails } from './types';
import { courses as initialCourses, users as initialUsers } from './data';

const LOGGED_IN_USER_KEY = 'loggedInUserId';

export class AcademiaAIDB extends Dexie {
  courses!: Table<Course>;
  users!: Table<User>;
  enrollments!: Table<Enrollment>;
  userProgress!: Table<UserProgress>;

  constructor() {
    super('AcademiaAIDB');
    this.version(1).stores({
      courses: 'id, isSynced',
      users: 'id, email, isSynced',
      enrollments: '++id, studentId, courseId, status, isSynced',
      userProgress: '++id, [userId+courseId], progress, isSynced',
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
    await db.users.bulkAdd(initialUsers.map(u => ({...u, isSynced: true})));
    console.log("Database populated.");
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


// --- Data Access Functions ---

export async function addCourse(course: Omit<Course, 'id' | 'isSynced' | 'updatedAt' | 'progress' | 'modules'> & { modules: any[] }) {
  const newCourse: Course = {
    ...course,
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    progress: 0,
    isSynced: false,
    updatedAt: new Date().toISOString(),
  };
  return await db.courses.add(newCourse);
}

export async function getAllCourses(): Promise<Course[]> {
  return await db.courses.toArray();
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

export async function updateEnrollmentStatus(enrollmentId: number, status: 'approved' | 'rejected'): Promise<number> {
    return await db.enrollments.update(enrollmentId, { status, updatedAt: new Date().toISOString(), isSynced: false });
}

export async function getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
  const approvedEnrollments = await db.enrollments
    .where({ studentId: userId, status: 'approved' })
    .toArray();
  
  if (approvedEnrollments.length === 0) return [];

  const courseIds = approvedEnrollments.map(e => e.courseId);
  
  const enrolledCourses = await db.courses.where('id').anyOf(courseIds).toArray();

  return enrolledCourses;
}


export async function updateUserProgress(progressUpdate: { userId: string; courseId: string; progress: number; status: UserProgress['status'] }) {
    const { userId, courseId, progress, status } = progressUpdate;
    
    const existingProgress = await db.userProgress.where({ userId, courseId }).first();

    const progressData = {
        userId,
        courseId,
        progress,
        status,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    
    if (existingProgress?.id) {
        return await db.userProgress.update(existingProgress.id, progressData as UserProgress);
    } else {
        return await db.userProgress.add(progressData as UserProgress);
    }
}
