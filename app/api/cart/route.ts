import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/cart  — charger le panier
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json([], { status: 200 });

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { sizes: true } } },
  });

  return NextResponse.json(
    items.map((i) => ({ ...i.product, quantity: i.quantity, selectedSize: i.size ?? undefined }))
  );
}

// POST /api/cart  — sauvegarder le panier (remplace tout)
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const items: Array<{ id: string; quantity: number; selectedSize?: string }> = await req.json();

  // Supprimer puis recréer
  await prisma.cartItem.deleteMany({ where: { userId: user.id } });

  if (items.length > 0) {
    await prisma.cartItem.createMany({
      data: items.map((i) => ({
        userId: user.id,
        productId: i.id,
        quantity: i.quantity,
        size: i.selectedSize ?? null,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/cart  — vider le panier
export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
