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
