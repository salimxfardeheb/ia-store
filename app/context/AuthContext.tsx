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
  logout:          () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage cache used only for instant first paint of user-dependent UI;
// the source of truth is the HttpOnly session cookie verified by /api/auth/me.
const USER_CACHE_KEY = "ia_user";

async function silentRefresh() {
  try {
    await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  } catch { /* network error — ignore, token still valid until it expires */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from cache for instant UI, then verify against the server cookie.
  useEffect(() => {
    const cached = typeof window !== "undefined" ? localStorage.getItem(USER_CACHE_KEY) : null;
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
    }

    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then(({ user: serverUser }) => {
        if (cancelled) return;
        if (serverUser) {
          setUser(serverUser);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(serverUser));
          // Attempt a refresh right away in case the token is already close to expiry
          silentRefresh();
        } else {
          setUser(null);
          localStorage.removeItem(USER_CACHE_KEY);
        }
      })
      .catch(() => { /* network error — keep cached state */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Refresh on window focus so a user returning to the tab never hits a stale token
  useEffect(() => {
    const onFocus = () => { if (user) silentRefresh(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const { message, error } = await res.json().catch(() => ({}));
      throw new Error(message ?? error ?? "Erreur de connexion");
    }

    const { user: authUser } = await res.json();
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const { message, error } = await res.json().catch(() => ({}));
      throw new Error(message ?? error ?? "Erreur d'inscription");
    }

    const { user: authUser } = await res.json();
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

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
