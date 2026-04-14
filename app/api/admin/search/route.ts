import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";

// GET /api/admin/search?q=<term>  (ADMIN + SELLER)
// Returns up to 4 results per entity: products, orders, customers
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ products: [], orders: [], customers: [] });
  }

  const [products, orders, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name:     { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, category: true, mainImage: true, status: true },
      take:    4,
      orderBy: { createdAt: "desc" },
    }),

    prisma.order.findMany({
      where: {
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      select: { id: true, name: true, total: true, status: true, createdAt: true },
      take:    4,
      orderBy: { createdAt: "desc" },
    }),

    prisma.user.findMany({
      where: {
        role: "CLIENT",
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      select:  { id: true, name: true, email: true, phone: true },
      take:    4,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const STATUS_LABEL: Record<string, string> = {
    PENDING:   "En attente",
    CONFIRMED: "Confirmée",
    SHIPPED:   "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    RETURNED:  "Retournée",
  };

  return NextResponse.json({
    products: products.map((p) => ({
      id:        p.id,
      name:      p.name,
      category:  p.category,
      mainImage: p.mainImage,
      status:    p.status,
    })),
    orders: orders.map((o) => ({
      id:      o.id,
      shortId: `#${o.id.slice(-6).toUpperCase()}`,
      name:    o.name,
      total:   o.total,
      status:  STATUS_LABEL[o.status] ?? o.status,
    })),
    customers: customers.map((c) => ({
      id:    c.id,
      name:  c.name,
      email: c.email,
      phone: c.phone ?? null,
    })),
  });
}
