'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarContents } from '@/components/sidebar-contents';
import { navItems } from '@/lib/nav';
import { populateDatabase } from '@/lib/db';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle =
    navItems
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.label || 'Dashboard';

  // Populate the database on initial client load
  useEffect(() => {
    populateDatabase();
  }, []);

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
