'use client';
import { Badge } from "./ui/badge";
import { useFilter } from "@/contexts/FilterContext";

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  const { setSelectedTag } = useFilter();

  return (
    <Badge 
      variant="secondary" 
      className="cursor-pointer hover:bg-primary/20"
      onClick={() => setSelectedTag(tag)}
    >
      {tag}
    </Badge>
  );
}
