import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { cartBodySchema, safeParse, apiError, handleDbError } from "@/lib/validation";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/cart  — load cart (requires auth)
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const items = await prisma.cartItem.findMany({
      where:   { userId: user.id },
      include: { product: { include: { sizes: true, variants: { include: { sizes: true } } } } },
    });

    return NextResponse.json(
      items.map((i) => ({
        ...i.product,
        variants: i.product.variants.map((v) => ({
          id:    v.id,
          color: v.color,
          sku:   v.sku ?? undefined,
          sizes: v.sizes.map((s) => ({ name: s.name, stock: s.stock, price: s.price ?? undefined })),
        })),
        quantity:     i.quantity,
        selectedSize: i.size ?? undefined,
      }))
    );
  } catch (err) {
    return handleDbError(err);
  }
}

// POST /api/cart  — save cart (replaces all items)
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const [items, err] = safeParse(cartBodySchema, body);
  if (err) return err;

  // Verify every product exists and is active before writing
  if (items.length > 0) {
    const productIds = [...new Set(items.map((i) => i.id))];
    const valid = await prisma.product.findMany({
      where:  { id: { in: productIds }, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    const validIds = new Set(valid.map((p) => p.id));
    const invalid  = productIds.find((id) => !validIds.has(id));
    if (invalid) {
      return apiError("INVALID_PRODUCT", "Un ou plusieurs produits sont invalides", 400);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      if (items.length > 0) {
        await tx.cartItem.createMany({
          data: items.map((i) => ({
            userId:    user.id,
            productId: i.id,
            quantity:  i.quantity,
            size:      i.selectedSize ?? null,
          })),
        });
      }
    });
  } catch (err) {
    return handleDbError(err);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/cart  — clear cart
export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  } catch (err) {
    return handleDbError(err);
  }

  return NextResponse.json({ ok: true });
}
