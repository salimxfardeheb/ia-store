import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { OrderStatus } from "@/app/generated/prisma/enums";

function monthRange(monthsAgo: number) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// CA et panier moyen ne doivent pas compter les commandes non honorées.
const REVENUE_STATUSES = {
  notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] as OrderStatus[],
};

const LOW_STOCK_THRESHOLD = 5;
const LOW_STOCK_LIMIT     = 5;

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
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const thisMonth  = monthRange(0);
  const lastMonth  = monthRange(1);
  const yearStart  = new Date(new Date().getFullYear(), 0, 1);

  const [
    kpiThis,
    kpiLast,
    recentOrdersRaw,
    lowVariantSizes,
    lowProductSizes,
    lowSimpleProducts,
    yearOrders,
    categoryItems,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: thisMonth.start, lte: thisMonth.end },
        status:    REVENUE_STATUSES,
      },
      _sum:   { total: true },
      _count: { _all: true },
      _avg:   { total: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: lastMonth.start, lte: lastMonth.end },
        status:    REVENUE_STATUSES,
      },
      _sum:   { total: true },
      _count: { _all: true },
      _avg:   { total: true },
    }),
    prisma.order.findMany({
      take:    5,
      orderBy: { createdAt: "desc" },
      select:  { id: true, name: true, status: true, total: true, createdAt: true },
    }),
    // Variantes (couleur × taille) en rupture/seuil — la vraie source pour les produits à variantes
    prisma.variantSize.findMany({
      where: {
        stock:   { lte: LOW_STOCK_THRESHOLD },
        variant: { product: { deletedAt: null } },
      },
      orderBy: { stock: "asc" },
      take:    LOW_STOCK_LIMIT,
      select: {
        stock:   true,
        name:    true,
        variant: {
          select: {
            color:   true,
            product: { select: { name: true } },
          },
        },
      },
    }),
    // Tailles de produits sans variantes
    prisma.productSize.findMany({
      where: {
        quantity: { lte: LOW_STOCK_THRESHOLD },
        product:  { deletedAt: null, variants: { none: {} } },
      },
      orderBy: { quantity: "asc" },
      take:    LOW_STOCK_LIMIT,
      select: {
        size:     true,
        quantity: true,
        product:  { select: { name: true } },
      },
    }),
    // Produits simples (ni variantes, ni tailles) — Product.stock fait encore foi
    prisma.product.findMany({
      where: {
        stock:     { lte: LOW_STOCK_THRESHOLD },
        deletedAt: null,
        variants:  { none: {} },
        sizes:     { none: {} },
      },
      orderBy: { stock: "asc" },
      take:    LOW_STOCK_LIMIT,
      select:  { name: true, stock: true },
    }),
    // Revenu par mois — groupBy(createdAt) ne groupait rien (timestamp unique
    // par commande). On lit createdAt + total et on agrège côté JS.
    prisma.order.findMany({
      where: {
        createdAt: { gte: yearStart },
        status:    REVENUE_STATUSES,
      },
      select: { createdAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by:     ["category"],
      where:  { order: { status: REVENUE_STATUSES } },
      _count: { category: true },
    }),
  ]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  function trend(current: number, previous: number): { trend: string; isUp: boolean } {
    if (previous === 0) return { trend: "+0%", isUp: true };
    const pct = ((current - previous) / previous) * 100;
    return { trend: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, isUp: pct >= 0 };
  }

  const revenue      = kpiThis._sum?.total  ?? 0;
  const lastRevenue  = kpiLast._sum?.total  ?? 0;
  const orders       = kpiThis._count?._all ?? 0;
  const lastOrders   = kpiLast._count?._all ?? 0;
  const avg          = kpiThis._avg?.total  ?? 0;
  const lastAvg      = kpiLast._avg?.total  ?? 0;

  // ── Revenue chart (monthly, current year) ─────────────────────────────────
  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const byMonth = Array(12).fill(0);
  for (const o of yearOrders) {
    byMonth[new Date(o.createdAt).getMonth()] += o.total;
  }
  const currentMonth  = new Date().getMonth();
  const revenueChart  = MONTHS.slice(0, currentMonth + 1).map((name, i) => ({
    name,
    revenue: Math.round(byMonth[i]),
  }));

  // ── Category distribution ──────────────���──────────────────────────────────
  const totalItems   = categoryItems.reduce((s, c) => s + (c._count?.category ?? 0), 0) || 1;
  const categoryData = categoryItems.map((c) => ({
    name:  c.category,
    value: Math.round(((c._count?.category ?? 0) / totalItems) * 100),
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

  // ── Low stock ─────────────────────────────────────────────────────────────
  // Fusion des trois sources (variantes / tailles / produits simples), tri global, top N.
  const lowStock = [
    ...lowVariantSizes.map((vs) => ({
      name:      vs.variant.product.name,
      size:      `${vs.variant.color} · ${vs.name}`,
      stock:     vs.stock,
      threshold: 10,
    })),
    ...lowProductSizes.map((ps) => ({
      name:      ps.product.name,
      size:      ps.size,
      stock:     ps.quantity,
      threshold: 10,
    })),
    ...lowSimpleProducts.map((p) => ({
      name:      p.name,
      size:      "Unique",
      stock:     p.stock,
      threshold: 10,
    })),
  ]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, LOW_STOCK_LIMIT);

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
