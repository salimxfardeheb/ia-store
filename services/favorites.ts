import { Product } from "@/app/variables";

export interface FavoriteProduct extends Product {
  favoritedAt: string;
}

// Auth est porté par le cookie HttpOnly — on a juste besoin de credentials:'include'.

export async function loadFavorites(): Promise<FavoriteProduct[]> {
  const res = await fetch("/api/favorites", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

export async function addFavorite(productId: string): Promise<boolean> {
  const res = await fetch("/api/favorites", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ productId }),
  });
  return res.ok;
}

export async function removeFavorite(productId: string): Promise<boolean> {
  const res = await fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
    method:      "DELETE",
    credentials: "include",
  });
  return res.ok;
}
