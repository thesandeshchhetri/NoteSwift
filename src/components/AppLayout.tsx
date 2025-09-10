'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Logo } from './Logo';
import { UserNav } from './UserNav';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useNotes } from '@/contexts/NotesContext';
import { useFilter } from '@/contexts/FilterContext';
import { Tag } from 'lucide-react';
import Link from 'next/link';
import { ReminderHandler } from './ReminderHandler';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { notes } = useNotes();
  const { selectedTag, setSelectedTag } = useFilter();

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center">
                <Tag className="mr-2"/>
                Tags
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/">
                    <SidebarMenuButton
                      onClick={() => setSelectedTag(null)}
                      isActive={selectedTag === null}
                    >
                      All Notes
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                {allTags.map(tag => (
                  <SidebarMenuItem key={tag}>
                    <SidebarMenuButton
                      onClick={() => setSelectedTag(tag)}
                      isActive={selectedTag === tag}
                    >
                      {tag}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </ScrollArea>
        <Separator />
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
        <ReminderHandler />
      </SidebarInset>
    </SidebarProvider>
  );
}
