
// src/lib/db-providers/types.ts
import type {
    Course, User, Enrollment, UserProgress, PendingEnrollmentDetails, ForumMessage,
    ForumMessageWithReplies, Notification, Resource, CourseResource, Announcement,
    ChatChannel, ChatMessage, Role, ComplianceReportData, DirectMessageThread,
    CalendarEvent, ExternalTraining, EnrollmentStatus, EnrollmentWithDetails, Cost,
    StudentForManagement, AIConfig, AIUsageLog, Badge, UserBadge, UserStatus,
    CustomCostCategory, LearningPath, UserLearningPathProgress, CourseRating, RolePermission, SystemLog, LogLevel
} from '@/lib/types';
import Dexie from 'dexie';

/**
 * Defines the common interface for any database provider.
 * This ensures that different data storage engines (Dexie, a REST API, etc.)
 * can be swapped seamlessly. This interface mirrors the high-level functions
 * needed by the application.
 */
export interface DBProvider {
  // Direct DB access (for complex queries in components)
  db: Dexie;

  // Initialization
  populateDatabase(): Promise<void>;
  
  // Auth
  login(email: string, password?: string): Promise<User | null>;
  logout(): void;
  getLoggedInUser(): Promise<User | null>;

  // User
  addUser(user: Omit<User, 'id' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>): Promise<User>;
  bulkAddUsers(users: Omit<User, 'id' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>[]): Promise<string[]>;
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<Omit<User, 'id' | 'isSynced' | 'password'>>): Promise<number>;
  updateUserStatus(userId: string, status: UserStatus): Promise<number>;
  saveFcmToken(userId: string, fcmToken: string): Promise<number>;
  deleteUser(id: string): Promise<void>;

  // Course
  addCourse(course: Partial<Omit<Course, 'id' | 'isSynced' | 'updatedAt'>>): Promise<string>;
  getAllCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number>;
  updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number>;
  deleteCourse(id: string): Promise<void>;

  // Enrollment
  requestEnrollment(courseId: string, studentId: string): Promise<number>;
  getApprovedEnrollmentCount(courseId: string): Promise<number>;
  getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]>;
  getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]>;
  getEnrollmentsForStudent(userId: string): Promise<EnrollmentWithDetails[]>;
  updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number>;
  getEnrolledCoursesForUser(userId: string): Promise<Course[]>;
  getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]>;

  // User Progress
  getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined>;
  getUserProgressForUser(userId: string): Promise<UserProgress[]>;
  markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void>;

  // Forum
  addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]>;
  deleteForumMessage(messageId: number): Promise<void>;

  // Notifications
  addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<number>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  checkAndSendDeadlineReminders(user: User): Promise<void>;

  // Resources
  addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getAllResources(): Promise<Resource[]>;
  deleteResource(resourceId: number): Promise<void>;
  associateResourceWithCourse(courseId: string, resourceId: number): Promise<void>;
  dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void>;
  getResourcesForCourse(courseId: string): Promise<Resource[]>;
  getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]>;

  // Announcements
  addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  deleteAnnouncement(id: number): Promise<void>;
  getAllAnnouncements(): Promise<Announcement[]>;
  getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]>;

  // Chat
  addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getChatMessages(channelId: number | string): Promise<ChatMessage[]>;
  getPublicChatChannels(): Promise<ChatChannel[]>;
  addPublicChatChannel(name: string, description: string): Promise<string>;
  getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]>;
  getOrCreateDirectMessageThread(currentUserId: string, otherUserId: string): Promise<ChatChannel>;

  // Compliance
  getComplianceReportData(departmentFilter?: string, roleFilter?: string): Promise<ComplianceReportData[]>;

  // Calendar
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]>;
  addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number>;
  deleteCalendarEvent(id: number): Promise<void>;

  // External Training
  getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]>;
  addExternalTraining(training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateExternalTraining(id: number, data: Partial<Omit<ExternalTraining, 'id'>>): Promise<number>;
  deleteExternalTraining(id: number): Promise<void>;

  // Costs
  getAllCosts(): Promise<Cost[]>;
  addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number>;
  deleteCost(id: number): Promise<void>;
  getAllCostCategories(): Promise<CustomCostCategory[]>;
  addCostCategory(category: { name: string }): Promise<number>;
  deleteCostCategory(id: number): Promise<void>;

  // Instructors
  getCoursesByInstructorName(instructorName: string): Promise<Course[]>;
  getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]>;

  // Gamification
  getAllBadges(): Promise<Badge[]>;
  getBadgesForUser(userId: string): Promise<UserBadge[]>;
  awardBadge(userId: string, badgeId: string): Promise<void>;

  // AI Config
  getAIConfig(): Promise<AIConfig>;
  saveAIConfig(config: AIConfig): Promise<string>;
  logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number>;

  // Learning Paths
  getAllLearningPaths(): Promise<LearningPath[]>;
  getLearningPathById(id: number): Promise<LearningPath | undefined>;
  addLearningPath(path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number>;
  deleteLearningPath(id: number): Promise<void>;
  getLearningPathsForUser(user: User): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]>;

  // Ratings
  addCourseRating(rating: Omit<CourseRating, 'id' | 'isPublic' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getRatingByUserAndCourse(userId: string, courseId: string): Promise<CourseRating | undefined>;
  getRatingsForCourse(courseId: string): Promise<CourseRating[]>;
  getRatingsForInstructor(instructorName: string): Promise<CourseRating[]>;
  toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number>;

  // Permissions
  getPermissionsForRole(role: Role): Promise<string[]>;
  updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number>;

  // System Logs
  logSystemEvent(level: LogLevel, message: string, details?: Record<string, any>): Promise<void>;
  getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]>;
  clearAllSystemLogs(): Promise<void>;
  
  // Sync
  getUnsyncedItemsCount(): Promise<number>;
  syncWithSupabase(): Promise<{ success: boolean; message: string; }>;
}

    