export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Only for storage, will be stripped from context
  role?: 'superadmin' | 'user';
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  summary: string;
  createdAt: string;
  updatedAt: string;
  reminderSet: boolean;
  reminderAt: string | null;
  deletedAt?: string | null;
}
