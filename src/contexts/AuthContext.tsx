'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { auth, getDb } from '@/lib/firebase';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  loading: boolean;
  signup: (details: Omit<User, 'id'>) => Promise<void>;
  login: (credentials: Omit<User, 'id' | 'username'>) => Promise<boolean>;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
  sendPasswordResetEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const db = await getDb();
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ id: firebaseUser.uid, email: firebaseUser.email!, username: userData.username });
        } else {
           setUser({ id: firebaseUser.uid, email: firebaseUser.email!, username: firebaseUser.email! });
        }
      } catch (error) {
          console.error("Failed to get user document:", error);
          // Fallback or error handling
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
      
      const db = await getDb();
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        username: details.username,
        email: details.email,
      });
      
      await handleUser(firebaseUser);

      toast({ title: 'Success', description: 'Account created successfully!' });
      router.push('/');

    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const login = async (credentials: Omit<User, 'id' | 'username'>): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password!);
      await handleUser(userCredential.user);

      toast({ title: 'Success', description: 'Logged in successfully!' });
      router.push('/');
      return true;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid email or password.' });
      return false;
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

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      toast({ title: 'Success', description: 'Password reset email sent. Please check your inbox.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updatePassword, sendPasswordResetEmail }}>
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
