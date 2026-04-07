import { Product } from "@/app/variables";

export async function getAllProducts(category?: string): Promise<Product[]> {
  const url = category && category !== "Tous"
    ? `/api/products?category=${encodeURIComponent(category)}`
    : "/api/products";

  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function getProductById(id: string): Promise<Product | null> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch("/api/products/categories");
  if (!res.ok) return [];
  return res.json();
}
