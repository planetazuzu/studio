import { z } from 'zod';

export type Role =
  | 'Trabajador'
  | 'Personal Externo'
  | 'Formador'
  | 'Gestor de RRHH'
  | 'Jefe de Formación'
  | 'Administrador General';

export type Department = 'Técnicos de Emergencias' | 'Teleoperadores' | 'Administración' | 'Formación' | 'Logística';

export type NotificationChannel = 'email' | 'whatsapp' | 'app';
export const notificationChannels: NotificationChannel[] = ['email', 'whatsapp', 'app'];

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for authentication
  avatar: string;
  role: Role;
  department: Department;
  employeeId?: string;
  registrationDate?: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
  notificationSettings?: {
    consent: boolean;
    channels: NotificationChannel[];
  };
};

export type Course = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  duration: string;
  modality: 'Online' | 'Presencial' | 'Mixta';
  image: string;
  aiHint: string;
  modules: Module[];
  status: 'draft' | 'published';
  mandatoryForRoles?: Role[];
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  category?: string;
  capacity?: number;
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export const enrollmentStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'waitlisted', 'active', 'completed', 'expelled', 'expired', 'needs_review'] as const;
export type EnrollmentStatus = typeof enrollmentStatuses[number];

export type Enrollment = {
    id?: number; // auto-incremented primary key
    studentId: string;
    courseId: string;
    requestDate: string; // ISO date string
    status: EnrollmentStatus;
    justification?: string; // For admin feedback on approval/rejection
    isSynced?: boolean;
    updatedAt?: string; // ISO date string
}

export type UserProgress = {
    id?: number; // auto-incremented primary key
    userId: string;
    courseId: string;
    completedModules: string[]; // Array of completed module IDs
    isSynced?: boolean;
    updatedAt?: string; // ISO date string
}

export type Module = {
  id: string;
  title: string;
  duration: string;
  content: string;
}

export type Cost = {
  id: string;
  item: string;
  category: 'Honorarios Formador' | 'Licencias de Plataforma' | 'Equipamiento' | 'Logística y Dietas' | 'Otro';
  amount: number;
  date: string;
  courseId?: string;
  userId?: string;
};

// For displaying pending enrollments with user and course names
export type PendingEnrollmentDetails = Enrollment & {
  userName: string;
  courseTitle: string;
};

// For displaying ANY enrollment with details
export type EnrollmentWithDetails = Enrollment & {
  userName: string;
  userEmail: string;
  courseTitle: string;
  courseImage: string;
}

export type ForumMessage = {
  id?: number;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string; // ISO date string
  parentId: number | null; // For threading
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ForumMessageWithReplies = ForumMessage & {
  replies: ForumMessageWithReplies[];
};

export type Notification = {
  id?: number;
  userId: string;
  message: string;
  type: 'enrollment_approved' | 'new_course' | 'forum_reply';
  relatedUrl?: string;
  isRead: boolean;
  timestamp: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ResourceType = 'pdf' | 'video' | 'link' | 'document';

export type Resource = {
  id?: number;
  name: string;
  type: ResourceType;
  url: string; // For links, this is the URL. For files, it will be a data URI.
  uploadedAt: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type CourseResource = {
    id?: number;
    courseId: string;
    resourceId: number;
};

export type AnnouncementType = 'Urgente' | 'Informativo' | 'Mantenimiento';

export const announcementTypes: AnnouncementType[] = ['Urgente', 'Informativo', 'Mantenimiento'];

export type Announcement = {
  id?: number;
  title: string;
  content: string;
  type: AnnouncementType;
  channels: string[]; // Array of Role, Department names, or 'Todos'
  timestamp: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ChatChannel = {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  participantIds?: string[];
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ChatMessage = {
  id?: number;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ComplianceReportData = {
    userId: string;
    userName: string;
    userRole: Role;
    mandatoryCoursesCount: number;
    completedCoursesCount: number;
    complianceRate: number;
};

export type DirectMessageThread = ChatChannel & {
    otherParticipant: {
        id: string;
        name: string;
        avatar: string;
    }
};

export type CalendarEventType = 'clase' | 'examen' | 'entrega' | 'taller' | 'otro';
export const calendarEventTypes: CalendarEventType[] = ['clase', 'examen', 'entrega', 'taller', 'otro'];

export type CalendarEvent = {
  id?: number; // auto-incremented primary key
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay: boolean;
  courseId: string; // Link to the course
  type: CalendarEventType;
  createdBy: string; // User ID
  modifiedBy: string; // User ID
  isCompleted: boolean;
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export const externalTrainingTypes = ['Curso', 'Certificación', 'Máster', 'Taller', 'Conferencia', 'Otro'] as const;
export type ExternalTrainingType = typeof externalTrainingTypes[number];

export type ExternalTraining = {
  id?: number;
  userId: string;
  title: string;
  type: ExternalTrainingType;
  institution: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  fileUrl?: string; // URL to the certificate
  comments?: string;
  isRelevant?: boolean;
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

// --- AI Flow Schemas ---

// From: src/ai/flows/announcement-email-generation.ts
export const GenerateAnnouncementEmailInputSchema = z.object({
  recipientName: z.string().describe('The name of the person receiving the email.'),
  announcementTitle: z.string().describe('The title of the announcement.'),
  announcementContent: z.string().describe('The content of the announcement.'),
});
export type GenerateAnnouncementEmailInput = z.infer<typeof GenerateAnnouncementEmailInputSchema>;

export const GenerateAnnouncementEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email, formatted for an email client.'),
});
export type GenerateAnnouncementEmailOutput = z.infer<typeof GenerateAnnouncementEmailOutputSchema>;


// From: src/ai/flows/course-suggestion.ts
export const PersonalizedCourseRecommendationsInputSchema = z.object({
  userRole: z.string().describe("The user's current role in the organization (e.g., 'Técnico de Emergencias', 'Jefe de Formación')."),
  enrolledCourseTitles: z.array(z.string()).describe('A list of titles of internal courses the user is already enrolled in or has completed.'),
  externalTrainingTitles: z.array(z.string()).describe('A list of titles of external courses or certifications the user has registered.'),
  allAvailableCourseTitles: z.array(z.string()).describe('The complete list of internal course titles available in the catalog for suggestion.'),
});
export type PersonalizedCourseRecommendationsInput = z.infer<typeof PersonalizedCourseRecommendationsInputSchema>;

const SuggestionSchema = z.object({
  courseTitle: z.string().describe('The title of the suggested course. Must be one of the titles from the `allAvailableCourseTitles` list.'),
  reason: z.string().describe('A brief, one-sentence explanation for why this course is being recommended to the user, in Spanish.'),
});

export const PersonalizedCourseRecommendationsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).max(3).describe('An array of up to 3 course recommendations.'),
});
export type PersonalizedCourseRecommendationsOutput = z.infer<typeof PersonalizedCourseRecommendationsOutputSchema>;


// From: src/ai/flows/course-tutor.ts
export const CourseTutorInputSchema = z.object({
  courseContent: z.string().describe('The full content of the course.'),
  question: z.string().describe("The user's question about the course."),
});
export type CourseTutorInput = z.infer<typeof CourseTutorInputSchema>;

export const CourseTutorOutputSchema = z.object({
  answer: z.string().describe("The AI tutor's answer to the question."),
});
export type CourseTutorOutput = z.infer<typeof CourseTutorOutputSchema>;


// From: src/ai/flows/feedback-personalization.ts
export const PersonalizedFeedbackInputSchema = z.object({
  studentName: z.string().describe('The name of the student receiving feedback.'),
  assignmentName: z.string().describe('The name of the assignment or test.'),
  score: z.number().describe('The final score of the student as a percentage.'),
  questions: z
    .array(
      z.object({
        question: z.string(),
        studentAnswer: z.string(),
        correctAnswer: z.string(),
      })
    )
    .describe('The list of questions, student answers, and correct answers.'),
});
export type PersonalizedFeedbackInput = z.infer<typeof PersonalizedFeedbackInputSchema>;

export const PersonalizedFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Personalized feedback for the student.'),
});
export type PersonalizedFeedbackOutput = z.infer<typeof PersonalizedFeedbackOutputSchema>;


// From: src/ai/flows/generate-course-from-topic.ts
export const GenerateCourseFromTopicInputSchema = z.string().describe('The topic for which to generate the course.');
export type GenerateCourseFromTopicInput = z.infer<typeof GenerateCourseFromTopicInputSchema>;

const AIGeneratedModuleSchema = z.object({
  title: z.string().describe('The title of the module.'),
  duration: z.string().describe('An estimated duration for the module, e.g., "2 horas".'),
  content: z.string().describe('A detailed summary of the content to be covered in this module.'),
});

export const GenerateCourseFromTopicOutputSchema = z.object({
  title: z.string().describe("A compelling and professional title for the course."),
  description: z.string().describe("A short, engaging description for the course card (1-2 sentences)."),
  longDescription: z.string().describe("A detailed description for the course page, outlining its objectives and what students will learn."),
  instructor: z.string().describe("A plausible Spanish name for a suitable instructor for this course."),
  duration: z.string().describe("The total estimated duration for the entire course, e.g., '16 horas'."),
  modality: z.enum(['Online', 'Presencial', 'Mixta']).describe("The most suitable modality for this course."),
  modules: z.array(AIGeneratedModuleSchema).min(3).max(7).describe("An array of 3 to 7 well-structured modules for the course."),
});
export type GenerateCourseFromTopicOutput = z.infer<typeof GenerateCourseFromTopicOutputSchema>;


// From: src/ai/flows/generate-test-questions.ts
export const GenerateTestQuestionsInputSchema = z.object({
  courseContent: z
    .string()
    .describe('The content of the course for which to generate test questions.'),
  numberOfQuestions: z
    .number()
    .default(5)
    .describe('The number of test questions to generate.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
    .describe('The difficulty level of the test questions.'),
});
export type GenerateTestQuestionsInput = z.infer<typeof GenerateTestQuestionsInputSchema>;

export const GenerateTestQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The test question.'),
      options: z.array(z.string()).describe('The possible answers for the question.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
    })
  ).
describe('The generated test questions.'),
});
export type GenerateTestQuestionsOutput = z.infer<typeof GenerateTestQuestionsOutputSchema>;


// From: src/ai/flows/notification-email-generation.ts
export const GenerateNotificationEmailInputSchema = z.object({
  recipientName: z.string().describe('The name of the person receiving the email.'),
  courseName: z.string().describe('The name of the course the notification is about.'),
  notificationType: z.enum(['course_reminder', 'new_course_available', 'feedback_ready']).describe('The type of notification being sent.'),
});
export type GenerateNotificationEmailInput = z.infer<typeof GenerateNotificationEmailInputSchema>;

export const GenerateNotificationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email.'),
});
export type GenerateNotificationEmailOutput = z.infer<typeof GenerateNotificationEmailOutputSchema>;

// From: src/ai/flows/summarize-module-content.ts
export const SummarizeModuleContentInputSchema = z.string().describe('The content of the module to be summarized.');
export type SummarizeModuleContentInput = z.infer<typeof SummarizeModuleContentInputSchema>;

export const SummarizeModuleContentOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the module's content, highlighting key learning points."),
});
export type SummarizeModuleContentOutput = z.infer<typeof SummarizeModuleContentOutputSchema>;


// From: src/ai/flows/predict-abandonment.ts
export const PredictAbandonmentInputSchema = z.object({
  userName: z.string().describe('The name of the student.'),
  lastLogin: z.string().describe('Time since the student last logged in (e.g., "hace 3 días", "hace 2 semanas").'),
  activeCoursesCount: z.number().describe('The number of courses the student is currently enrolled in.'),
  completedCoursesCount: z.number().describe('The number of courses the student has completed.'),
  averageProgress: z.number().describe('The average completion percentage across all active courses.'),
});
export type PredictAbandonmentInput = z.infer<typeof PredictAbandonmentInputSchema>;

export const PredictAbandonmentOutputSchema = z.object({
  riskLevel: z.enum(['Bajo', 'Medio', 'Alto']).describe('The predicted risk level of abandonment.'),
  justification: z.string().describe('A brief, 2-3 sentence justification for the predicted risk level, explaining the key factors.'),
});
export type PredictAbandonmentOutput = z.infer<typeof PredictAbandonmentOutputSchema>;
