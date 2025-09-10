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
import { Home, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <ScrollArea className="flex-1">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
          <SidebarMenu>
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
                    <SidebarMenuButton isActive={pathname.startsWith('/admin/users')}>
                        <Users />
                        Users
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </ScrollArea>
  );
}