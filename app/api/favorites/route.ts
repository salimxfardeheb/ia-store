import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import {
  favoriteBodySchema,
  safeParse,
  apiError,
  handleDbError,
} from "@/lib/validation";
import { requireSameOrigin } from "@/lib/csrf";

async function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/favorites — list favorites (requires auth)
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Non autorisé", 401);

  try {
    const favorites = await prisma.favorite.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            extraImages: { orderBy: { sortOrder: "asc" } },
            sizes:       true,
            variants:    { include: { sizes: true } },
          },
        },
      },
    });

    const shaped = favorites
      .filter((f) => f.product && !f.product.deletedAt)
      .map((f) => ({
        ...f.product,
        extraImages: f.product.extraImages.map((img) => ({
          url:   img.url,
          ...(img.color ? { color: img.color } : {}),
        })),
        variants: f.product.variants.map((v) => ({
          id:    v.id,
          color: v.color,
          sku:   v.sku ?? undefined,
          sizes: v.sizes.map((s) => ({
            name:  s.name,
            stock: s.stock,
            price: s.price ?? undefined,
          })),
        })),
        favoritedAt: f.createdAt,
      }));

    return NextResponse.json(shaped);
  } catch (err) {
    return handleDbError(err);
  }
}

// POST /api/favorites — add a product to favorites (idempotent)
export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const user = await getUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Non autorisé", 401);

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(favoriteBodySchema, body);
  if (err) return err;

  // Ensure the product exists and is active before favoriting
  const product = await prisma.product.findFirst({
    where:  { id: data.productId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!product) {
    return apiError("INVALID_PRODUCT", "Produit invalide", 400);
  }

  try {
    // Upsert keeps it idempotent: re-favoriting is a no-op, no duplicate row
    await prisma.favorite.upsert({
      where:  { userId_productId: { userId: user.id, productId: data.productId } },
      create: { userId: user.id, productId: data.productId },
      update: {},
    });
  } catch (e) {
    return handleDbError(e);
  }

  return NextResponse.json({ ok: true });
}
