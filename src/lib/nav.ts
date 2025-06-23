import { BookOpen, Home, Settings, Wallet } from 'lucide-react';

export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Cursos' },
  { href: '/dashboard/cost-tracking', icon: Wallet, label: 'Costes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes' },
];
