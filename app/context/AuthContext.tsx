"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;       // données Firestore
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Charger le profil depuis Firestore
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
          localStorage.setItem('ia_user', JSON.stringify(snap.data()));
        }
      } else {
        setProfile(null);
        localStorage.removeItem('ia_user');
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, name: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const token = await user.getIdToken();

    await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged s'occupe du reste automatiquement
  };

  const logout = async () => {
    await signOut(auth);
  };

  const getToken = async () => {
    return user ? user.getIdToken() : null;
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, register, logout, isAuthenticated: !!user, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}