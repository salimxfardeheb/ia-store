import { Product } from "@/app/variables";

export async function getAllProducts(category?: string, limit?: number): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== "Tous") params.set("category", category);
  params.set("limit", String(limit && limit > 0 ? limit : 12));
  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.products ?? []);
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
