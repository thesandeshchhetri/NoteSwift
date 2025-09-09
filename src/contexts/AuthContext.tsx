'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import emailjs from '@emailjs/browser';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  signup: (details: Omit<User, 'id'>) => Promise<void>;
  login: (credentials: Omit<User, 'id'>) => void;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (otp: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'noteswift-users';
const OTP_STORAGE_KEY = 'noteswift-otp';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const loggedInUser = sessionStorage.getItem('noteswift-loggedin-user');
      if (loggedInUser) {
        const parsedUser: User = JSON.parse(loggedInUser);
        setUser({ id: parsedUser.id, email: parsedUser.email, username: parsedUser.username });
      }
    } catch (error) {
      console.error('Failed to load user from session storage', error);
      sessionStorage.removeItem('noteswift-loggedin-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsers = (): User[] => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };
  
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const sendOtp = async (email: string) => {
    const otp = generateOtp();
    sessionStorage.setItem(OTP_STORAGE_KEY, otp);

    console.log(`Sending OTP ${otp} to ${email}`);
    
    try {
      const templateParams = {
        to_email: email,
        otp: otp,
      };
      await emailjs.send('Noteswift', 'MRCCMS', templateParams, 'ts-Fq9pfLF4zrjo8j');
      toast({ title: 'Success', description: 'OTP sent to your email.' });
      return true;
    } catch (error) {
      console.error('EmailJS send failed:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      toast({ variant: 'destructive', title: 'Error', description: `Failed to send OTP. Please check console for details.` });
      return false;
    }
  };
  
  const verifyOtp = (otp: string) => {
    const storedOtp = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (otp === storedOtp) {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
      return true;
    }
    return false;
  };

  const signup = async (details: Omit<User, 'id'>) => {
    const users = getUsers();
    const existingUser = users.find(u => u.email === details.email || u.username === details.username);

    if (existingUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'An account with this email or username already exists.' });
      return;
    }

    const newUser: User = { ...details, id: new Date().toISOString() };
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    
    const { password, ...userToSet } = newUser;
    setUser(userToSet);
    sessionStorage.setItem('noteswift-loggedin-user', JSON.stringify(userToSet));

    toast({ title: 'Success', description: 'Account created successfully!' });
    router.push('/');
  };

  const login = (credentials: Omit<User, 'id'>) => {
    const users = getUsers();
    const foundUser = users.find(u => u.email === credentials.email);

    if (foundUser && foundUser.password === credentials.password) {
      const { password, ...userToSet } = foundUser;
      setUser(userToSet);
      sessionStorage.setItem('noteswift-loggedin-user', JSON.stringify(userToSet));
      toast({ title: 'Success', description: 'Logged in successfully!' });
      router.push('/');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid email or password.' });
    }
  };
  
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('noteswift-loggedin-user');
    router.push('/login');
    toast({ title: 'Logged out', description: 'You have been logged out.' });
  };

  const updatePassword = (newPassword: string) => {
    if (user) {
      const users = getUsers();
      const userIndex = users.findIndex(u => u.id === user.id);

      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        saveUsers(users);
        toast({ title: 'Success', description: 'Password updated successfully.' });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updatePassword, sendOtp, verifyOtp }}>
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
