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
import { ScrollArea } from './ui/scroll-area';
import { useFilter } from '@/contexts/FilterContext';
import { Tag } from 'lucide-react';
import Link from 'next/link';

interface TagSidebarProps {
  tags: string[];
}

export function TagSidebar({ tags }: TagSidebarProps) {
  const { selectedTag, setSelectedTag } = useFilter();

  return (
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
            {tags.map(tag => (
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
  );
}
