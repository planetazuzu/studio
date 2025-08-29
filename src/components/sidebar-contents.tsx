'use client';

import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNavItems } from '@/lib/nav';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import * as db from '@/lib/db';
import { ChevronsLeft, ChevronsRight, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';

export function SidebarContents() {
  const { isOpen, setIsOpen, isMobile } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();
  const allNavItems = getNavItems();
  
  const userPermissions = useLiveQuery(
    () => user ? db.getPermissionsForRole(user.role) : Promise.resolve([]),
    [user?.role]
  );

  if (!user || userPermissions === undefined) {
    return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  const visibleNavItems = allNavItems.filter((item) =>
    userPermissions.includes(item.href)
  );

  const activeItem = visibleNavItems
    .filter((item) => pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          {isOpen && <span className="text-xl font-semibold">TalentOS</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={item.href === activeItem?.href}
                  tooltip={item.label}
                  className="h-12 w-full justify-start"
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
        <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {isOpen && (
                    <div className="overflow-hidden">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {user.role}
                    </p>
                    </div>
                )}
            </div>
             {!isMobile && (
                <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(!isOpen)}
                >
                {isOpen ? <ChevronsLeft /> : <ChevronsRight />}
                </Button>
            )}
        </div>
      </SidebarFooter>
    </>
  );
}
