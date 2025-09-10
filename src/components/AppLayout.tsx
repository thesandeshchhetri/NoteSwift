'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from './Logo';
import { UserNav } from './UserNav';
import { Separator } from './ui/separator';
import { ReminderHandler } from './ReminderHandler';
import { ClientOnly } from './ClientOnly';

export function AppLayout({
  children,
  sidebarContent,
}: {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <Separator />
        {sidebarContent}
        <Separator />
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
        <ClientOnly>
          <ReminderHandler />
        </ClientOnly>
      </SidebarInset>
    </SidebarProvider>
  );
}
