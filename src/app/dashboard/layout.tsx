'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Home, Settings, Wallet } from 'lucide-react';

import { AppLogo } from '@/components/icons';
import { user } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';

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
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <AppLogo className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">AcademiaAI</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <DashboardHeader title={pageTitle} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
