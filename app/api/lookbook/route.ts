import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/lookbook — looks actifs pour la homepage
export async function GET() {
  const looks = await prisma.lookBook.findMany({
    where:   { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        take: 4,
        include: {
          product: {
            select: { id: true, name: true, mainImage: true, category: true, price: true },
          },
        },
      },
    },
  });

  return NextResponse.json(looks);
}
