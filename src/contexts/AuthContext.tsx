'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (details: Omit<User, 'id'>) => void;
  login: (credentials: Omit<User, 'id' | 'username'>) => void;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'noteswift-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser({ id: parsedUser.id, username: parsedUser.username });
      }
    } catch (error) {
      console.error('Failed to load user from local storage', error);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = (details: Omit<User, 'id'>) => {
    const newUser: User = { ...details, id: new Date().toISOString() };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser({ id: newUser.id, username: newUser.username });
    toast({ title: 'Success', description: 'Account created successfully!' });
    router.push('/');
  };

  const login = (credentials: Omit<User, 'id' | 'username'>) => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      if (parsedUser.password === credentials.password) {
        setUser({ id: parsedUser.id, username: parsedUser.username });
        toast({ title: 'Success', description: 'Logged in successfully!' });
        router.push('/');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid password.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No account found. Please sign up.' });
    }
  };
  
  const logout = () => {
    setUser(null);
    // While the user object is removed from local storage on signup,
    // we don't remove it on logout to allow "remembering" the user for the login screen.
    // To completely clear all data, a separate "delete account" would be needed.
    router.push('/login');
    toast({ title: 'Logged out', description: 'You have been logged out.' });
  };

  const updatePassword = (newPassword: string) => {
    if (user) {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        parsedUser.password = newPassword;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsedUser));
        toast({ title: 'Success', description: 'Password updated successfully.' });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
