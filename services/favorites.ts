import { Product } from "@/app/variables";

export interface FavoriteProduct extends Product {
  favoritedAt: string;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function loadFavorites(token: string): Promise<FavoriteProduct[]> {
  const res = await fetch("/api/favorites", { headers: authHeader(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function addFavorite(token: string, productId: string): Promise<boolean> {
  const res = await fetch("/api/favorites", {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body:    JSON.stringify({ productId }),
  });
  return res.ok;
}

export async function removeFavorite(token: string, productId: string): Promise<boolean> {
  const res = await fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
    method:  "DELETE",
    headers: authHeader(token),
  });
  return res.ok;
}
