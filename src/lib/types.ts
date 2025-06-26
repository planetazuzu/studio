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


import type { PredictAbandonmentInputSchema, PredictAbandonmentOutputSchema } from '@/ai/flows/predict-abandonment';
import { z } from 'zod';

export type PredictAbandonmentInput = z.infer<typeof PredictAbandonmentInputSchema>;
export type PredictAbandonmentOutput = z.infer<typeof PredictAbandonmentOutputSchema>;
