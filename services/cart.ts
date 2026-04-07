import { Product } from "@/app/variables";

export interface CartItem extends Product {
  quantity: number;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function loadCart(token: string): Promise<CartItem[]> {
  const res = await fetch("/api/cart", {
    headers: authHeader(token),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function saveCart(token: string, items: CartItem[]): Promise<void> {
  await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(items.map((i) => ({ id: i.id, quantity: i.quantity }))),
  });
}

export async function clearCart(token: string): Promise<void> {
  await fetch("/api/cart", {
    method: "DELETE",
    headers: authHeader(token),
  });
}
