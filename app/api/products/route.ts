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
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
    ...(limit > 0 ? { take: limit } : {}),
  });

  return NextResponse.json(products);
}
