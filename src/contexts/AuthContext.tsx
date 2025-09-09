'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import emailjs from '@emailjs/browser';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
  applyActionCode,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/lib/firebase';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  signup: (details: Omit<User, 'id'>) => Promise<void>;
  login: (credentials: Omit<User, 'id'>) => void;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({ id: firebaseUser.uid, email: firebaseUser.email!, username: userData.username });
      } else {
         setUser({ id: firebaseUser.uid, email: firebaseUser.email!, username: firebaseUser.email! });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, []);


  const signup = async (details: Omit<User, 'id'>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, details.email, details.password!);
      const firebaseUser = userCredential.user;
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        username: details.username,
        email: details.email,
      });
      
      await handleUser(firebaseUser); // Immediately process user data

      toast({ title: 'Success', description: 'Account created successfully!' });
      router.push('/');

    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const login = async (credentials: Omit<User, 'id'>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password!);
      await handleUser(userCredential.user); // Immediately process user data

      toast({ title: 'Success', description: 'Logged in successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid email or password.' });
    }
  };
  
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
      toast({ title: 'Logged out', description: 'You have been logged out.' });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (auth.currentUser) {
      try {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
        toast({ title: 'Success', description: 'Password updated successfully.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
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
