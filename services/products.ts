import { Product } from "@/app/variables";

export async function getAllProducts(category?: string, limit?: number): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== "Tous") params.set("category", category);
  if (limit && limit > 0) params.set("limit", String(limit));
  const qs  = params.size ? `?${params.toString()}` : "";
  const res = await fetch(`/api/products${qs}`);
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
