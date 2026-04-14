import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { handleDbError } from "@/lib/validation";
import { Order } from "@/app/variables";

const VALID_ORDER_STATUSES = new Set([
  "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
] as const);

type PrismaOrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

// GET /api/admin/orders?page=1&limit=50&status=<status> (ADMIN + SELLER)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10) || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const skip   = (page - 1) * limit;
  const rawStatus = searchParams.get("status")?.toUpperCase();
  const status    = rawStatus && VALID_ORDER_STATUSES.has(rawStatus as PrismaOrderStatus)
    ? (rawStatus as PrismaOrderStatus)
    : undefined;

  const where = status ? { status } : undefined;

  try {
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include:  { items: true },
        orderBy:  { createdAt: "desc" },
        skip,
        take:     limit,
      }),
      prisma.order.count({ where }),
    ]);

    const result: Order[] = orders.map((o) => ({
      id: o.id,
      form: {
        uid:           o.userId ?? "",
        name:          o.name,
        phone:         o.phone,
        email:         o.email,
        city:          o.city,
        address:       o.address,
        postalCode:    o.postalCode,
        paymentMethod: o.paymentMethod as "cash" | "card",
        deliveryType:  o.deliveryType  as "home" | "bureau",
      },
      items: o.items.map((i) => ({
        id:           i.productId ?? "",
        name:         i.name,
        price:        i.price,
        quantity:     i.quantity,
        selectedSize: i.size ?? undefined,
        mainImage:    i.mainImage,
        category:     i.category,
        stock:        0,
        sizes:        [],
        status:       "Actif" as const,
        createdAt:    "",
        extraImages:  [],
      })),
      total:     o.total,
      status:    o.status.toLowerCase() as Order["status"],
      channel:   (o.channel?.toLowerCase() ?? "online") as "online" | "offline",
      createdAt: o.createdAt,
    }));

    return NextResponse.json(result, {
      headers: {
        "X-Total-Count": String(total),
        "X-Page":        String(page),
        "X-Limit":       String(limit),
      },
    });
  } catch (err) {
    return handleDbError(err);
  }
}
