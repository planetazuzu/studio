import { AreaChart, BookOpen, Home, Settings } from 'lucide-react';

export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Cursos' },
  { href: '/dashboard/analytics', icon: AreaChart, label: 'Análisis' },
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes' },
];
