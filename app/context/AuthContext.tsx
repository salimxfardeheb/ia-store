"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { UserProfile } from "../variables";

interface AuthUser {
  id:    string;
  email: string;
  name:  string;
  role:  "ADMIN" | "SELLER" | "CLIENT";
}

interface AuthContextType {
  user:            AuthUser | null;
  profile:         UserProfile | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:           (email: string, password: string) => Promise<void>;
  register:        (email: string, name: string, password: string) => Promise<void>;
  logout:          () => void;
  getToken:        () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "ia_token";
const USER_KEY  = "ia_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on first render (client-only)
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token  = localStorage.getItem(TOKEN_KEY);
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const { message, error } = await res.json();
      throw new Error(message ?? error ?? "Erreur de connexion");
    }

    const { token, user: authUser } = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const { message, error } = await res.json();
      throw new Error(message ?? error ?? "Erreur d'inscription");
    }

    const { token, user: authUser } = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const profile: UserProfile | null = user
    ? { uid: user.id, email: user.email, name: user.name }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
