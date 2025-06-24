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
    this.version(2).stores({
      users: 'id, &email, isSynced', // Email is now a unique index
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
export async function addUser(user: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt'>): Promise<string> {
    const newUser: User = {
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}`,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.users.add(newUser);
}

export async function bulkAddUsers(users: Omit<User, 'id' | 'avatar' | 'isSynced' | 'updatedAt'>[]): Promise<string[]> {
    const newUsers: User[] = users.map(user => ({
        ...user,
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        avatar: `https://i.pravatar.cc/150?u=user${Date.now()}${Math.random()}`,
        isSynced: false,
        updatedAt: new Date().toISOString(),
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

export async function addCourse(course: Omit<Course, 'id' | 'progress' | 'modules' | 'isSynced' | 'updatedAt' | 'startDate' | 'endDate'>) {
  const newCourse: Course = {
    ...course,
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    progress: 0,
    modules: [], // Start with no modules, they can be added later
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
