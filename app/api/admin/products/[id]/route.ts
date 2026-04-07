import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product, SizeEntry } from "@/app/variables";

function toPrismaStatus(s: string) {
  if (s === "Actif") return "ACTIVE";
  if (s === "Archivé") return "ARCHIVED";
  return "DRAFT";
}
function fromPrismaStatus(s: string): Product["status"] {
  if (s === "ACTIVE") return "Actif";
  if (s === "ARCHIVED") return "Archivé";
  return "Brouillon";
}

// PUT /api/admin/products/:id  — mettre à jour un produit
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: Product = await req.json();

  // Supprimer les tailles existantes puis recréer
  await prisma.productSize.deleteMany({ where: { productId: id } });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category,
      price: body.price,
      stock: body.stock,
      status: toPrismaStatus(body.status),
      mainImage: body.mainImage,
      extraImages: JSON.stringify(body.extraImages ?? []),
      sizes: {
        create: (body.sizes as SizeEntry[]).map((s) => ({
          size: s.size,
          quantity: s.quantity,
        })),
      },
    },
    include: { sizes: true },
  });

  const result: Product = {
    id: updated.id,
    name: updated.name,
    category: updated.category,
    price: updated.price,
    stock: updated.stock,
    status: fromPrismaStatus(updated.status),
    mainImage: updated.mainImage,
    extraImages: JSON.parse(updated.extraImages || "[]"),
    createdAt: updated.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    sizes: updated.sizes,
  };

  return NextResponse.json(result);
}

// DELETE /api/admin/products/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
