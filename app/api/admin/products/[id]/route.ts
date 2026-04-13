import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, isNextResponse } from "@/lib/rbac";
import { productWriteSchema, safeParse, apiError } from "@/lib/validation";
import { Product } from "@/app/variables";

function toPrismaStatus(s: string) {
  if (s === "Actif")   return "ACTIVE";
  if (s === "Archivé") return "ARCHIVED";
  return "DRAFT";
}

function fromPrismaStatus(s: string): Product["status"] {
  if (s === "ACTIVE")   return "Actif";
  if (s === "ARCHIVED") return "Archivé";
  return "Brouillon";
}

// PUT /api/admin/products/:id — update a product (ADMIN only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  // Verify the product exists and is not soft-deleted
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return apiError("NOT_FOUND", "Produit introuvable", 404);
  }

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(productWriteSchema, body);
  if (err) return err;

  // Replace sizes: delete existing then recreate
  await prisma.productSize.deleteMany({ where: { productId: id } });

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
    },
    include: { sizes: true },
  });

  let extraImages: string[] = [];
  try { extraImages = JSON.parse(updated.extraImages || "[]"); } catch { /* ignore */ }

  const result: Product = {
    id:          updated.id,
    name:        updated.name,
    category:    updated.category,
    price:       updated.price,
    stock:       updated.stock,
    status:      fromPrismaStatus(updated.status),
    mainImage:   updated.mainImage,
    extraImages,
    createdAt:   updated.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    }),
    sizes: updated.sizes,
  };

  return NextResponse.json(result);
}

// DELETE /api/admin/products/:id — soft-delete a product (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return apiError("NOT_FOUND", "Produit introuvable", 404);
  }

  // Soft delete: set deletedAt instead of hard-deleting, preserving order history
  await prisma.product.update({
    where: { id },
    data:  { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
