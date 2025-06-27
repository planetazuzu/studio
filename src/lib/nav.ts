
import { AreaChart, BookOpen, Home, Settings, Users, Calendar, Library, Megaphone, MessagesSquare, ClipboardCheck, UserRoundCog, Wallet, Trophy, Route, type LucideIcon } from 'lucide-react';
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

export const getNavItems = (t: (key: string) => string): NavItem[] => [
  { href: '/dashboard', icon: Home, label: t('Dashboard'), roles: allRoles },
  { href: '/dashboard/courses', icon: BookOpen, label: t('Courses'), roles: allRoles },
  { href: '/dashboard/enrollments', icon: ClipboardCheck, label: t('Enrollments'), roles: allRoles },
  { href: '/dashboard/leaderboard', icon: Trophy, label: t('Leaderboard'), roles: allRoles },
  {
    href: '/dashboard/learning-paths',
    icon: Route,
    label: t('LearningPaths'),
    roles: managerRoles,
  },
  {
    href: '/dashboard/calendar',
    icon: Calendar,
    label: t('Calendar'),
    roles: managerRoles,
  },
  {
    href: '/dashboard/library',
    icon: Library,
    label: t('Library'),
    roles: managerRoles,
  },
  {
    href: '/dashboard/users',
    icon: Users,
    label: t('Users'),
    roles: managerRoles,
  },
   {
    href: '/dashboard/instructors',
    icon: UserRoundCog,
    label: t('Instructors'),
    roles: managerRoles,
  },
  {
    href: '/dashboard/communications',
    icon: Megaphone,
    label: t('Communications'),
    roles: managerRoles,
  },
  {
    href: '/dashboard/costs',
    icon: Wallet,
    label: t('Costs'),
    roles: managerRoles,
  },
  {
    href: '/dashboard/analytics',
    icon: AreaChart,
    label: t('Analytics'),
    roles: managerRoles,
  },
  { href: '/dashboard/chat', icon: MessagesSquare, label: t('Chat'), roles: allRoles },
  { href: '/dashboard/settings', icon: Settings, label: t('Settings'), roles: allRoles },
];
