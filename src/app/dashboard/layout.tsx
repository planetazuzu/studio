'use client';

import { usePathname } from 'next/navigation';
import { BookOpen, Home, Settings, Wallet } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarContents } from '@/components/sidebar-contents';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Cursos' },
  { href: '/dashboard/cost-tracking', icon: Wallet, label: 'Costes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = navItems.find(item => item.href === pathname)?.label || 'Dashboard';

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarContents />
        </Sidebar>
        <SidebarInset>
          <DashboardHeader title={pageTitle} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
