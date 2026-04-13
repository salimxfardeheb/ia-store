import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwner, isNextResponse } from "@/lib/rbac";
import { productWriteSchema, safeParse, apiError } from "@/lib/validation";
import { Product } from "@/app/variables";

// ─── Status mapping ───────────────────────────────────────────────────────────

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

function toProduct(p: {
  id: string; name: string; category: string; price: number; stock: number;
  status: string; mainImage: string; extraImages: string; createdAt: Date;
  sizes: { size: string; quantity: number }[];
}): Product {
  let extraImages: string[] = [];
  try { extraImages = JSON.parse(p.extraImages || "[]"); } catch { /* ignore */ }

  return {
    id:          p.id,
    name:        p.name,
    category:    p.category,
    price:       p.price,
    stock:       p.stock,
    status:      fromPrismaStatus(p.status),
    mainImage:   p.mainImage,
    extraImages,
    createdAt:   p.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    }),
    sizes: p.sizes,
  };
}

// GET /api/admin/products — list all non-deleted products (ADMIN + SELLER)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const products = await prisma.product.findMany({
    where:   { deletedAt: null },
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products.map(toProduct));
}

// POST /api/admin/products — create a product (ADMIN only)
export async function POST(req: NextRequest) {
  const auth = requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(productWriteSchema, body);
  if (err) return err;

  const product = await prisma.product.create({
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

  return NextResponse.json(toProduct(product), { status: 201 });
}
