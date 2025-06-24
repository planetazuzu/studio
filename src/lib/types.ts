export type Role =
  | 'Trabajador'
  | 'Personal Externo'
  | 'Formador'
  | 'Gestor de RRHH'
  | 'Jefe de Formación'
  | 'Administrador General';

export type Department = 'Técnicos de Emergencias' | 'Teleoperadores' | 'Administración' | 'Formación' | 'Logística';

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
    courseReminders: boolean;
    newCourses: boolean;
    feedbackReady: boolean;
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
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  category?: string;
  capacity?: number;
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type Enrollment = {
    id?: number; // auto-incremented primary key
    studentId: string;
    courseId: string;
    requestDate: string; // ISO date string
    status: 'pending' | 'approved' | 'rejected';
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
  category: 'Formadores' | 'Plataforma' | 'Equipamiento' | 'Logística' | 'Otro';
  amount: number;
  date: string;
};

// For displaying pending enrollments with user and course names
export type PendingEnrollmentDetails = Enrollment & {
  userName: string;
  courseTitle: string;
};

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
  isSynced?: boolean;
  updatedAt?: string;
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
