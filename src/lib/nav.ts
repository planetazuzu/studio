import { AreaChart, BookOpen, Home, Settings, Users, Calendar, Library, Megaphone, MessagesSquare, ClipboardCheck, UserRoundCog, Wallet, type LucideIcon } from 'lucide-react';
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

export const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: allRoles },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Cursos', roles: allRoles },
  { href: '/dashboard/enrollments', icon: ClipboardCheck, label: 'Inscripciones', roles: allRoles },
  {
    href: '/dashboard/calendar',
    icon: Calendar,
    label: 'Calendario',
    roles: managerRoles,
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
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes', roles: allRoles },
];
