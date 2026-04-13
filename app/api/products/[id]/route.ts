import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/validation";

// GET /api/products/:id — public product detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where:   { id },
    include: { sizes: true },
  });

  if (!product || product.deletedAt) {
    return apiError("NOT_FOUND", "Produit introuvable", 404);
  }

  return NextResponse.json(product);
}
