import Dexie, { type Table } from 'dexie';
import type { Course, User, Enrollment, UserProgress } from './types';
import { courses as initialCourses, users as initialUsers } from './data';

export class AcademiaAIDB extends Dexie {
  courses!: Table<Course>;
  users!: Table<User>;
  enrollments!: Table<Enrollment>;
  userProgress!: Table<UserProgress>;

  constructor() {
    super('AcademiaAIDB');
    this.version(1).stores({
      courses: 'id, isSynced', // 'id' is the primary key, 'isSynced' is an index
      users: 'id, email, isSynced', // 'id' is the primary key, 'email' and 'isSynced' are indices
      enrollments: '++id, studentId, courseId, isSynced', // auto-incrementing pk, plus indices
      userProgress: '++id, [userId+courseId], progress, isSynced', // auto-incrementing pk, plus indices. Composite index for user/course lookups.
    });
  }
}

export const db = new AcademiaAIDB();

// --- Database Population ---

export async function populateDatabase() {
  const courseCount = await db.courses.count();
  if (courseCount === 0) {
    console.log("Populating database with initial data...");
    // Set isSynced to true for initial data as it's not new
    await db.courses.bulkAdd(initialCourses.map(c => ({...c, isSynced: true})));
    await db.users.bulkAdd(initialUsers.map(u => ({...u, isSynced: true})));
    console.log("Database populated.");
  }
}

// --- Data Access Functions ---

/**
 * Adds a new course to the database.
 * The course will be marked as not synced.
 * @param course The course data to add, without fields that are auto-generated.
 */
export async function addCourse(course: Omit<Course, 'id' | 'isSynced' | 'updatedAt' | 'progress' | 'modules'> & { modules: any[] }) {
  const newCourse: Course = {
    ...course,
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Simple unique ID
    progress: 0,
    isSynced: false,
    updatedAt: new Date().toISOString(),
  };
  return await db.courses.add(newCourse);
}


/**
 * Retrieves all courses from the database.
 * @returns A promise that resolves to an array of all courses.
 */
export async function getAllCourses(): Promise<Course[]> {
  return await db.courses.toArray();
}

/**
 * Adds a new enrollment record.
 * @param enrollment The enrollment data.
 */
export async function addEnrollment(enrollment: Omit<Enrollment, 'id' | 'isSynced' | 'updatedAt'>) {
    const newEnrollment: Enrollment = {
        ...enrollment,
        isSynced: false,
        updatedAt: new Date().toISOString(),
    };
    return await db.enrollments.add(newEnrollment);
}

/**
 * Adds or updates a user's progress on a course.
 * @param progressUpdate The progress data.
 */
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
        return await db.userProgress.update(existingProgress.id, progressData);
    } else {
        return await db.userProgress.add(progressData as UserProgress);
    }
}
