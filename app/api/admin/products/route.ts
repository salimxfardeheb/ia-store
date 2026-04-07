import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product, SizeEntry } from "@/app/variables";

// Mapping French status labels ↔ Prisma enum
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

function toProduct(p: {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  mainImage: string;
  extraImages: string;
  createdAt: Date;
  sizes: { size: string; quantity: number }[];
}): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    status: fromPrismaStatus(p.status),
    mainImage: p.mainImage,
    extraImages: JSON.parse(p.extraImages || "[]"),
    createdAt: p.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    sizes: p.sizes,
  };
}

// GET /api/admin/products  — tous les produits (admin)
export async function GET() {
  const products = await prisma.product.findMany({
    include: { sizes: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products.map(toProduct));
}

// POST /api/admin/products  — créer un produit
export async function POST(req: NextRequest) {
  const body: Product = await req.json();

  const product = await prisma.product.create({
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

  return NextResponse.json(toProduct(product), { status: 201 });
}
