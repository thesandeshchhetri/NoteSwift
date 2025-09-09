'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import emailjs from '@emailjs/browser';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  signup: (details: Omit<User, 'id'>) => void;
  login: (credentials: Omit<User, 'id'>) => void;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'noteswift-users';

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
        setUser({ id: parsedUser.id, email: parsedUser.email });
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
  }

  const sendOtp = async (email: string) => {
    // This is where you would implement the EmailJS logic.
    // You would need to:
    // 1. Generate a one-time password (OTP).
    // 2. Use emailjs.send() to send the OTP to the user's email.
    // 3. Store the OTP temporarily (e.g., in state or session storage) to verify it later.
    // 4. You will also need to build a new UI component to ask the user for the OTP they received.
    
    console.log(`(Placeholder) Sending OTP to ${email}`);
    // Example using emailjs.send:
    
    try {
      const templateParams = {
        to_email: email,
        otp: '123456', // Replace with a real generated OTP
      };
      await emailjs.send('Noteswift', 'MRCCMS', templateParams, 'YOUR_PUBLIC_KEY');
      toast({ title: 'Success', description: 'OTP sent to your email.' });
    } catch (error) {
      console.error('EmailJS error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send OTP.' });
    }
    
  }

  const signup = (details: Omit<User, 'id'>) => {
    // Before creating the user, you would call sendOtp and then show a form to verify the OTP.
    // For now, we'll proceed directly to creating the user.
    // await sendOtp(details.email);
    
    const users = getUsers();
    const existingUser = users.find(u => u.email === details.email);

    if (existingUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'An account with this email already exists.' });
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
