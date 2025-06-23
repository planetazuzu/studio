export type Role =
  | 'Trabajador'
  | 'Personal Externo'
  | 'Formador'
  | 'Gestor de RRHH'
  | 'Jefe de Formación'
  | 'Administrador General';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  duration: string;
  modality: 'Online' | 'Presencial';
  image: string;
  aiHint: string;
  progress: number;
  modules: Module[];
};

export type Module = {
  id: string;
  title: string;
  duration: string;
  content: string;
}

export type Cost = {
  id: string;
  item: string;
  category: 'Instructor' | 'Platform' | 'Materials' | 'Marketing' | 'Other';
  amount: number;
  date: string;
};
