import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products?category=xxx&sort=newest&page=1&limit=12 — public product catalog
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const sort     = searchParams.get("sort") ?? "newest";
  const promo    = searchParams.get("promo") === "true";
  const best     = searchParams.get("best")  === "true";
  const isNew    = searchParams.get("new")   === "true";
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip     = (page - 1) * limit;

  // "Nouveau" = créé dans les 7 derniers jours
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const orderBy =
    sort === "price-asc"  ? { price: "asc"  as const } :
    sort === "price-desc" ? { price: "desc" as const } :
    { createdAt: "desc" as const };

  const where = {
    status:    "ACTIVE" as const,
    deletedAt: null,
    ...(category && category !== "Tous" ? { category } : {}),
    ...(promo ? { discountPercent: { not: null } }          : {}),
    ...(best  ? { isBestSeller: true }                      : {}),
    ...(isNew ? { createdAt: { gte: sevenDaysAgo } }        : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { extraImages: { orderBy: { sortOrder: "asc" } }, sizes: true, variants: { include: { sizes: true } } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const shaped = products.map((p) => ({
    ...p,
    extraImages: p.extraImages.map((img) => ({
      url:   img.url,
      ...(img.color ? { color: img.color } : {}),
    })),
    variants: p.variants.map((v) => ({
      id:    v.id,
      color: v.color,
      sku:   v.sku ?? undefined,
      sizes: v.sizes.map((s) => ({
        name:  s.name,
        stock: s.stock,
        price: s.price ?? undefined,
      })),
    })),
  }));

  return NextResponse.json({ products: shaped, total, page, limit });
}
