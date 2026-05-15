import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products?category=xxx&limit=N — public product catalog
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit    = parseInt(searchParams.get("limit") ?? "0", 10);

  const products = await prisma.product.findMany({
    where: {
      status:    "ACTIVE",
      deletedAt: null,
      ...(category && category !== "Tous" ? { category } : {}),
    },
    include: {
      sizes:    true,
      variants: { include: { sizes: true } },
    },
    orderBy: { createdAt: "desc" },
    ...(limit > 0 ? { take: limit } : {}),
  });

  const shaped = products.map((p) => {
    let extraImages: unknown[] = [];
    try {
      const parsed = JSON.parse(p.extraImages || "[]");
      extraImages = Array.isArray(parsed) ? parsed : [];
    } catch {
      extraImages = [];
    }

    return {
      ...p,
      extraImages,
      variants: p.variants.map((v) => ({
        id: v.id,
        color: v.color,
        sku: v.sku ?? undefined,
        sizes: v.sizes.map((s) => ({
          name: s.name,
          stock: s.stock,
          price: s.price ?? undefined,
        })),
      })),
    };
  });

  return NextResponse.json(shaped);
}
