"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Product } from "../variables";
import { useAuth } from "./AuthContext";
import {
  loadFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
  FavoriteProduct,
} from "@/services/favorites";

interface FavoritesContextType {
  favorites:      FavoriteProduct[];
  favoriteIds:    Set<string>;
  isLoading:      boolean;
  isFavorite:     (productId: string) => boolean;
  toggleFavorite: (product: Product) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  requireAuth:    () => boolean; // returns true if user is allowed to proceed
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getToken } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch favorites whenever auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    loadFavorites(token)
      .then(setFavorites)
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.id)),
    [favorites]
  );

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  // Returns false (and redirects) if the user isn't authenticated
  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login?next=/favorites");
      return false;
    }
    return true;
  }, [isAuthenticated, router]);

  const toggleFavorite = useCallback(
    async (product: Product) => {
      if (!requireAuth()) return;
      const token = getToken();
      if (!token) return;

      const alreadyFav = favoriteIds.has(product.id);

      // Optimistic update
      if (alreadyFav) {
        setFavorites((prev) => prev.filter((f) => f.id !== product.id));
      } else {
        const optimistic: FavoriteProduct = {
          ...product,
          favoritedAt: new Date().toISOString(),
        };
        setFavorites((prev) => [optimistic, ...prev]);
      }

      const ok = alreadyFav
        ? await apiRemoveFavorite(token, product.id)
        : await apiAddFavorite(token, product.id);

      // Rollback on failure
      if (!ok) {
        if (alreadyFav) {
          setFavorites((prev) => [
            { ...product, favoritedAt: new Date().toISOString() },
            ...prev,
          ]);
        } else {
          setFavorites((prev) => prev.filter((f) => f.id !== product.id));
        }
      }
    },
    [favoriteIds, getToken, requireAuth]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      if (!requireAuth()) return;
      const token = getToken();
      if (!token) return;

      const previous = favorites;
      setFavorites((prev) => prev.filter((f) => f.id !== productId));

      const ok = await apiRemoveFavorite(token, productId);
      if (!ok) setFavorites(previous);
    },
    [favorites, getToken, requireAuth]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        isLoading,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        requireAuth,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
