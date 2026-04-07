import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/categories
export async function GET() {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { category: true },
    distinct: ["category"],
  });

  return NextResponse.json(rows.map((r) => r.category));
}
