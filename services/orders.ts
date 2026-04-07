import { Order, OrderForm } from "@/app/variables";
import { CartItem } from "@/services/cart";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getOrders(token: string): Promise<Order[]> {
  const res = await fetch("/api/orders", {
    headers: authHeader(token),
  });
  if (!res.ok) return [];
  const data = await res.json();

  // Adapter le format Prisma vers le type Order existant
  return data.map((o: {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    postalCode: string;
    paymentMethod: string;
    deliveryType: string;
    total: number;
    status: string;
    createdAt: string;
    items: CartItem[];
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
      paymentMethod: o.paymentMethod,
      deliveryType: o.deliveryType,
    },
    items: o.items,
    total: o.total,
    status: o.status.toLowerCase(),
    createdAt: new Date(o.createdAt),
  }));
}

export async function createOrder(
  token: string | null,
  data: { form: OrderForm; items: CartItem[]; total: number }
): Promise<string> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? authHeader(token) : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Erreur lors de la création de la commande");
  const { id } = await res.json();
  return id;
}
