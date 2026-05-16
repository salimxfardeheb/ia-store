import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, isNextResponse } from "@/lib/rbac";
import { productWriteSchema, safeParse, apiError } from "@/lib/validation";
import { toPrismaStatus, toProduct } from "@/lib/productStatus";
import { audit } from "@/lib/audit";

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

  // Replace sizes, variants, and extra images atomically: delete-then-recreate
  await prisma.$transaction(async (tx) => {
    await tx.productSize.deleteMany({ where: { productId: id } });
    await tx.productImage.deleteMany({ where: { productId: id } });
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
      extraImages: {
        create: data.extraImages.map((img, i) => ({
          url:       img.url,
          color:     img.color ?? null,
          sortOrder: i,
        })),
      },
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
    include: { extraImages: { orderBy: { sortOrder: "asc" } }, sizes: true, variants: { include: { sizes: true } } },
  });

  audit(auth.id, "product.updated", "Product", id, {
    before: { name: existing.name, status: existing.status, price: existing.price },
    after:  { name: data.name,     status: data.status,     price: data.price },
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

  audit(auth.id, "product.deleted", "Product", id, {
    before: { name: existing.name, status: existing.status },
  });

  return NextResponse.json({ ok: true });
}
