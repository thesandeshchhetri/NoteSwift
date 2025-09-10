'use client';

import * as React from 'react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ScrollArea } from '../ui/scroll-area';
import { ArrowLeft, Home, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();
  const isUserDetailPage = /^\/admin\/users\/.+/.test(pathname);

  return (
    <ScrollArea className="flex-1">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
          <SidebarMenu>
            {isUserDetailPage ? (
                 <SidebarMenuItem>
                    <Link href="/admin" passHref>
                        <SidebarMenuButton isActive={true}>
                            <ArrowLeft />
                            Back to All Users
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ) : (
                <>
                    <SidebarMenuItem>
                        <Link href="/admin" passHref>
                            <SidebarMenuButton isActive={pathname === '/admin'}>
                                <Home />
                                Dashboard
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin" passHref>
                            <SidebarMenuButton isActive={pathname.startsWith('/admin')}>
                                <Users />
                                Users
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </ScrollArea>
  );
}
