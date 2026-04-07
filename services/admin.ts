import { Product, Order, OrderStatus } from "@/app/variables";

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const res = await fetch("/api/admin/products");
  if (!res.ok) return [];
  return res.json();
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch("/api/products/categories");
  if (!res.ok) return [];
  return res.json();
}

export async function addProduct(product: Product): Promise<Product> {
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Erreur création produit");
  return res.json();
}

export async function updateProduct(product: Product, id: string): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Erreur mise à jour produit");
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/admin/orders");
  if (!res.ok) return [];
  return res.json();
}

export async function updateOrder(id: string, status: OrderStatus): Promise<void> {
  await fetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Erreur upload image");
  const { url } = await res.json();
  return url;
}
