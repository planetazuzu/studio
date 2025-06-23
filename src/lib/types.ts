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
  progress: number;
  modules: Module[];
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
    progress: number; // 0-100
    status: 'not-started' | 'in-progress' | 'completed';
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
