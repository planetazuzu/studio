'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarContents } from '@/components/sidebar-contents';
import { usePathname, useRouter } from 'next/navigation';
import { getNavItems } from '@/lib/nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = getNavItems();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const pageTitle =
    navItems
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.label || 'Dashboard';


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
