export interface User {
  id: string;
  username: string;
  password?: string; // Only for storage, will be stripped from context
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}
