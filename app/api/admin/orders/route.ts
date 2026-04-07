import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Order } from "@/app/variables";

// GET /api/admin/orders  — toutes les commandes (admin)
export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const result: Order[] = orders.map((o) => ({
    id: o.id,
    form: {
      uid: o.userId ?? "",
      name: o.name,
      phone: o.phone,
      email: o.email,
      city: o.city,
      address: o.address,
      postalCode: o.postalCode,
      paymentMethod: o.paymentMethod as "cash" | "card",
      deliveryType: o.deliveryType as "home" | "bureau",
    },
    items: o.items.map((i) => ({
      id: i.productId ?? "",
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      mainImage: i.mainImage,
      category: i.category,
      stock: 0,
      sizes: [],
      status: "Actif" as const,
      createdAt: "",
      extraImages: [],
    })),
    total: o.total,
    status: o.status.toLowerCase() as Order["status"],
    createdAt: o.createdAt,
  }));

  return NextResponse.json(result);
}
