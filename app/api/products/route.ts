import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products?category=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(category && category !== "Tous" ? { category } : {}),
    },
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}
