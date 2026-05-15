import { Product } from "@/app/variables";

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;  // taille choisie par le client
  selectedColor?: string; // couleur variante choisie (uniquement produits à variantes)
}

// Auth est porté par le cookie HttpOnly — on a juste besoin de credentials:'include'.

export async function loadCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
}

export async function saveCart(items: CartItem[]): Promise<void> {
  await fetch("/api/cart", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(items.map((i) => ({
      id:            i.id,
      quantity:      i.quantity,
      selectedSize:  i.selectedSize,
      selectedColor: i.selectedColor,
    }))),
  });
}

export async function clearCart(): Promise<void> {
  await fetch("/api/cart", { method: "DELETE", credentials: "include" });
}
