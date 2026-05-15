import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, isNextResponse } from "@/lib/rbac";
import { productWriteSchema, safeParse, apiError } from "@/lib/validation";
import { toPrismaStatus, toProduct } from "@/lib/productStatus";

// PUT /api/admin/products/:id — update a product (ADMIN only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return apiError("NOT_FOUND", "Produit introuvable", 404);
  }

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(productWriteSchema, body);
  if (err) return err;

  // Replace sizes + variants atomically: delete-then-recreate in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.productSize.deleteMany({ where: { productId: id } });
    // VariantSize rows are cascade-deleted when Variant rows are deleted
    await tx.variant.deleteMany({ where: { productId: id } });
  });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name:        data.name,
      category:    data.category,
      price:       data.price,
      stock:       data.stock,
      status:      toPrismaStatus(data.status),
      mainImage:   data.mainImage,
      extraImages: JSON.stringify(data.extraImages),
      sizes: {
        create: data.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
      },
      variants: {
        create: data.variants.map((v) => ({
          color: v.color,
          sku:   v.sku,
          sizes: {
            create: v.sizes.map((s) => ({
              name:  s.name,
              stock: s.stock,
              price: s.price,
            })),
          },
        })),
      },
    },
    include: { sizes: true, variants: { include: { sizes: true } } },
  });

  return NextResponse.json(toProduct(updated));
}

// DELETE /api/admin/products/:id — soft-delete (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return apiError("NOT_FOUND", "Produit introuvable", 404);
  }

  await prisma.product.update({
    where: { id },
    data:  { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
