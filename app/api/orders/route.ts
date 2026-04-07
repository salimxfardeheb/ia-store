import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/orders  — commandes de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders  — créer une commande
export async function POST(req: NextRequest) {
  const user = getUser(req);
  const body = await req.json();
  const { form, items, total } = body;

  const order = await prisma.order.create({
    data: {
      userId: user?.id ?? null,
      total,
      status: "PENDING",
      paymentMethod: form.paymentMethod ?? "cash",
      deliveryType: form.deliveryType ?? "home",
      name: form.name,
      phone: form.phone,
      email: form.email ?? "",
      city: form.city,
      address: form.address,
      postalCode: form.postalCode,
      items: {
        create: items.map((item: {
          id: string;
          name: string;
          price: number;
          quantity: number;
          mainImage: string;
          category: string;
        }) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          mainImage: item.mainImage ?? "",
          category: item.category ?? "",
        })),
      },
    },
  });

  return NextResponse.json({ id: order.id }, { status: 201 });
}
