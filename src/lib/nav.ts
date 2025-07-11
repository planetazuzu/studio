import { AreaChart, BookOpen, Home, Settings, Users, Calendar, Library, Megaphone, MessagesSquare, ClipboardCheck, UserRoundCog, Wallet, Trophy, Route, type LucideIcon, UserCircle, BellRing, ShieldAlert, GraduationCap } from 'lucide-react';
import type { Role } from './types';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: Role[];
};

const allRoles: Role[] = [
  'Trabajador',
  'Personal Externo',
  'Formador',
  'Gestor de RRHH',
  'Jefe de Formación',
  'Administrador General',
];

const managerRoles: Role[] = ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'];

export const getNavItems = (): NavItem[] => [
  { href: '/dashboard/dashboard', icon: Home, label: 'Dashboard', roles: allRoles },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Cursos', roles: allRoles },
  { href: '/dashboard/enrollments', icon: ClipboardCheck, label: 'Inscripciones', roles: allRoles },
  { href: '/dashboard/leaderboard', icon: Trophy, label: 'Clasificación', roles: allRoles },
  {
    href: '/dashboard/learning-paths',
    icon: GraduationCap,
    label: 'Planes de Carrera',
    roles: managerRoles,
  },
  {
    href: '/dashboard/calendar',
    icon: Calendar,
    label: 'Calendario',
    roles: allRoles,
  },
  {
    href: '/dashboard/library',
    icon: Library,
    label: 'Biblioteca',
    roles: managerRoles,
  },
  {
    href: '/dashboard/users',
    icon: Users,
    label: 'Usuarios',
    roles: managerRoles,
  },
   {
    href: '/dashboard/instructors',
    icon: UserRoundCog,
    label: 'Formadores',
    roles: managerRoles,
  },
  {
    href: '/dashboard/communications',
    icon: Megaphone,
    label: 'Avisos',
    roles: managerRoles,
  },
  {
    href: '/dashboard/costs',
    icon: Wallet,
    label: 'Gestión de Costes',
    roles: managerRoles,
  },
  {
    href: '/dashboard/analytics',
    icon: AreaChart,
    label: 'Análisis',
    roles: managerRoles,
  },
  { href: '/dashboard/chat', icon: MessagesSquare, label: 'Chat', roles: allRoles },
  { href: '/dashboard/profile', icon: UserCircle, label: 'Perfil', roles: allRoles },
  { href: '/dashboard/preferences', icon: BellRing, label: 'Preferencias', roles: allRoles },
  { href: '/dashboard/logs', icon: ShieldAlert, label: 'Registro del Sistema', roles: ['Administrador General'] },
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes', roles: ['Administrador General'] },
];
