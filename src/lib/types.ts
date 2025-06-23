export type Role =
  | 'Técnico de Emergencias'
  | 'Teleoperador de Emergencias'
  | 'Coordinador de Formación'
  | 'Administrador';

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
  modality: 'Online' | 'Presencial' | 'Mixta';
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
  category: 'Formadores' | 'Plataforma' | 'Equipamiento' | 'Logística' | 'Otro';
  amount: number;
  date: string;
};
