import { Order, OrderForm } from "@/app/variables";
import { CartItem } from "@/services/cart";

// Auth est porté par le cookie HttpOnly — on a juste besoin de credentials:'include'.

export async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();

  // Adapter le format Prisma vers le type Order existant
  return data.map((o: {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string | null;
    address: string | null;
    postalCode: string | null;
    paymentMethod: string;
    deliveryType: string;
    total: number;
    status: string;
    createdAt: string;
    items: {
      productId: string | null;
      name: string;
      price: number;
      quantity: number;
      size:  string | null;
      color: string | null;
      mainImage: string;
      category: string;
    }[];
  }) => ({
    id: o.id,
    form: {
      uid: "",
      name: o.name,
      phone: o.phone,
      email: o.email,
      city: o.city,
      address: o.address,
      postalCode: o.postalCode,
      paymentMethod: o.paymentMethod as "cash" | "card",
      deliveryType: o.deliveryType as "home" | "bureau" | "store",
    },
    items: o.items.map((i) => ({
      // OrderItem snapshot → CartItem-shaped row used in UI
      id:            i.productId ?? "",
      name:          i.name,
      price:         i.price,
      quantity:      i.quantity,
      selectedSize:  i.size  ?? undefined,
      selectedColor: i.color ?? undefined,
      mainImage:     i.mainImage,
      category:      i.category,
      // Filler fields required by CartItem extends Product but unused in order display
      stock:         0,
      sizes:         [],
      status:        "Actif" as const,
      createdAt:     "",
      extraImages:   [],
    })),
    total: o.total,
    status: o.status.toLowerCase(),
    createdAt: new Date(o.createdAt),
  }));
}

export async function createOrder(
  data: { form: OrderForm; items: CartItem[]; total: number }
): Promise<string> {
  const res = await fetch("/api/orders", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Erreur lors de la création de la commande");
  }
  const { id } = await res.json();
  return id;
}
