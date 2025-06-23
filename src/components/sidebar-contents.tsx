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
import { currentUser } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navItems } from '@/lib/nav';

export function SidebarContents() {
  const { isOpen } = useSidebar();
  const pathname = usePathname();

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
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
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {isOpen && (
            <div className="overflow-hidden">
              <p className="font-semibold truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.role}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </>
  );
}
