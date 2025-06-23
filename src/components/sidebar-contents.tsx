'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useSidebar } from '@/components/ui/sidebar';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons';
import { useAuth } from '@/contexts/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navItems } from '@/lib/nav';
import { Skeleton } from './ui/skeleton';

export function SidebarContents() {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const activeItem = visibleNavItems
    .filter((item) => pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <AppLogo className="h-8 w-8 text-primary" />
          {isOpen && <span className="text-xl font-semibold">EmergenciaAI</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={item.href === activeItem?.href}
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
          {isOpen && (
            <div className="overflow-hidden">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.role}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </>
  );
}
