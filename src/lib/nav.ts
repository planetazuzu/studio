import { AreaChart, BookOpen, Home, Settings, type LucideIcon } from 'lucide-react';
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

export const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', roles: allRoles },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Cursos', roles: allRoles },
  {
    href: '/dashboard/analytics',
    icon: AreaChart,
    label: 'Análisis',
    roles: ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'],
  },
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes', roles: allRoles },
];
