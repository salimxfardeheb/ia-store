import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";

function monthRange(monthsAgo: number) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

const STATUS_MAP: Record<string, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmé",
  SHIPPED:   "Expédié",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-black/10 text-black",
  CONFIRMED: "bg-black/5 text-black",
  SHIPPED:   "bg-black/80 text-white",
  DELIVERED: "bg-black text-white",
  CANCELLED: "bg-black text-white border border-black/20",
};

// GET /api/admin/dashboard (ADMIN + SELLER)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const thisMonth  = monthRange(0);
  const lastMonth  = monthRange(1);
  const yearStart  = new Date(new Date().getFullYear(), 0, 1);

  const [
    kpiThis,
    kpiLast,
    recentOrdersRaw,
    lowStockRaw,
    yearOrders,
    categoryItems,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: thisMonth.start, lte: thisMonth.end } },
      _sum:   { total: true },
      _count: true,
      _avg:   { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: lastMonth.start, lte: lastMonth.end } },
      _sum:   { total: true },
      _count: true,
      _avg:   { total: true },
    }),
    prisma.order.findMany({
      take:    5,
      orderBy: { createdAt: "desc" },
      select:  { id: true, name: true, status: true, total: true, createdAt: true },
    }),
    prisma.product.findMany({
      where:   { stock: { lte: 5 }, deletedAt: null },
      include: { sizes: true },
      orderBy: { stock: "asc" },
      take:    5,
    }),
    // Aggregate monthly revenue in SQL to avoid loading all orders into memory
    prisma.order.groupBy({
      by:      ["createdAt"],
      where:   { createdAt: { gte: yearStart } },
      _sum:    { total: true },
    }),
    prisma.orderItem.groupBy({
      by:     ["category"],
      _count: { category: true },
    }),
  ]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  function trend(current: number, previous: number): { trend: string; isUp: boolean } {
    if (previous === 0) return { trend: "+0%", isUp: true };
    const pct = ((current - previous) / previous) * 100;
    return { trend: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, isUp: pct >= 0 };
  }

  const revenue      = kpiThis._sum.total  ?? 0;
  const lastRevenue  = kpiLast._sum.total  ?? 0;
  const orders       = kpiThis._count;
  const lastOrders   = kpiLast._count;
  const avg          = kpiThis._avg.total  ?? 0;
  const lastAvg      = kpiLast._avg.total  ?? 0;

  // ── Revenue chart (monthly, current year) ─────────────────────────────────
  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const byMonth = Array(12).fill(0);
  for (const o of yearOrders) {
    if (o._sum.total) {
      byMonth[new Date(o.createdAt).getMonth()] += o._sum.total;
    }
  }
  const currentMonth  = new Date().getMonth();
  const revenueChart  = MONTHS.slice(0, currentMonth + 1).map((name, i) => ({
    name,
    revenue: Math.round(byMonth[i]),
  }));

  // ── Category distribution ──────────────���──────────────────────────────────
  const totalItems   = categoryItems.reduce((s, c) => s + c._count.category, 0) || 1;
  const categoryData = categoryItems.map((c) => ({
    name:  c.category,
    value: Math.round((c._count.category / totalItems) * 100),
  }));

  // ── Recent orders ─────────────────────────────────────────────────────────
  const recentOrders = recentOrdersRaw.map((o) => ({
    id:          `#${o.id.slice(-6).toUpperCase()}`,
    customer:    o.name,
    status:      STATUS_MAP[o.status] ?? o.status,
    statusStyle: STATUS_STYLES[o.status] ?? "bg-black/5 text-black",
    amount:      `${o.total.toLocaleString("fr-FR")} DA`,
    date:        new Date(o.createdAt).toLocaleDateString("fr-FR"),
  }));

  // ── Low stock ───────────────────────────────────────────────────���─────────
  const lowStock = lowStockRaw.map((p) => {
    const lowestSize = p.sizes.length
      ? p.sizes.reduce((a, b) => (a.quantity < b.quantity ? a : b))
      : null;
    return {
      name:      p.name,
      size:      lowestSize?.size ?? "Unique",
      stock:     p.stock,
      threshold: 10,
    };
  });

  return NextResponse.json({
    kpis: {
      revenue:   { value: `${Math.round(revenue).toLocaleString("fr-FR")} DA`,   subtitle: "vs mois dernier", ...trend(revenue, lastRevenue) },
      orders:    { value: orders.toLocaleString("fr-FR"),                          subtitle: "vs mois dernier", ...trend(orders, lastOrders)   },
      avgBasket: { value: `${Math.round(avg).toLocaleString("fr-FR")} DA`,        subtitle: "vs mois dernier", ...trend(avg, lastAvg)          },
    },
    revenueChart,
    categoryData,
    recentOrders,
    lowStock,
  });
}
