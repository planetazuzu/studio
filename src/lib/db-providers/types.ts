
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
  addUser(user: Omit<User, 'id' | 'dexieId' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>): Promise<User>;
  bulkAddUsers(users: Omit<User, 'id' | 'dexieId' | 'avatar' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken'>[]): Promise<number[]>;
  getAllUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, data: Partial<Omit<User, 'id' | 'dexieId' | 'isSynced' | 'password'>>): Promise<number>;
  updateUserStatus(userId: number, status: UserStatus): Promise<number>;
  saveFcmToken(userId: number, fcmToken: string): Promise<number>;
  deleteUser(id: number): Promise<void>;

  // Course
  addCourse(course: Partial<Omit<Course, 'id' | 'dexieId' | 'isSynced' | 'updatedAt'>>): Promise<number>;
  getAllCourses(): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  updateCourse(id: number, data: Partial<Omit<Course, 'id' | 'dexieId' | 'isSynced'>>): Promise<number>;
  updateCourseStatus(id: number, status: 'draft' | 'published'): Promise<number>;
  deleteCourse(id: number): Promise<void>;

  // Enrollment
  requestEnrollment(courseId: number, studentId: number): Promise<number>;
  getApprovedEnrollmentCount(courseId: number): Promise<number>;
  getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]>;
  getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]>;
  getEnrollmentsForStudent(userId: number): Promise<EnrollmentWithDetails[]>;
  updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number>;
  getEnrolledCoursesForUser(userId: number): Promise<Course[]>;
  getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]>;

  // User Progress
  getUserProgress(userId: number, courseId: number): Promise<UserProgress | undefined>;
  getUserProgressForUser(userId: number): Promise<UserProgress[]>;
  markModuleAsCompleted(userId: number, courseId: number, moduleId: string): Promise<void>;

  // Forum
  addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getForumMessages(courseId: number): Promise<ForumMessageWithReplies[]>;
  deleteForumMessage(messageId: number): Promise<void>;

  // Notifications
  addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getNotificationsForUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<number>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  checkAndSendDeadlineReminders(user: User): Promise<void>;

  // Resources
  addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getAllResources(): Promise<Resource[]>;
  deleteResource(resourceId: number): Promise<void>;
  associateResourceWithCourse(courseId: number, resourceId: number): Promise<void>;
  dissociateResourceFromCourse(courseId: number, resourceId: number): Promise<void>;
  getResourcesForCourse(courseId: number): Promise<Resource[]>;
  getAssociatedResourceIdsForCourse(courseId: number): Promise<number[]>;

  // Announcements
  addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  deleteAnnouncement(id: number): Promise<void>;
  getAllAnnouncements(): Promise<Announcement[]>;
  getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]>;

  // Chat
  addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getChatMessages(channelId: number): Promise<ChatMessage[]>;
  getPublicChatChannels(): Promise<ChatChannel[]>;
  addPublicChatChannel(name: string, description: string): Promise<number>;
  getDirectMessageThreadsForUserWithDetails(userId: number): Promise<DirectMessageThread[]>;
  getOrCreateDirectMessageThread(currentUserId: number, otherUserId: number): Promise<ChatChannel>;

  // Compliance
  getComplianceReportData(departmentFilter?: string, roleFilter?: string): Promise<ComplianceReportData[]>;

  // Calendar
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvents(courseIds: number[]): Promise<CalendarEvent[]>;
  addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number>;
  deleteCalendarEvent(id: number): Promise<void>;

  // External Training
  getExternalTrainingsForUser(userId: number): Promise<ExternalTraining[]>;
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
  getStudentsForCourseManagement(courseId: number): Promise<StudentForManagement[]>;

  // Gamification
  getAllBadges(): Promise<Badge[]>;
  getBadgesForUser(userId: number): Promise<UserBadge[]>;
  awardBadge(userId: number, badgeId: string): Promise<void>;

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
  addCourseRating(rating: Omit<CourseRating, 'id' | 'isPublic'>): Promise<number>;
  getRatingByUserAndCourse(userId: number, courseId: number): Promise<CourseRating | undefined>;
  getRatingsForCourse(courseId: number): Promise<CourseRating[]>;
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
