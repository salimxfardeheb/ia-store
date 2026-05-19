import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwner, isNextResponse } from "@/lib/rbac";
import { productWriteSchema, safeParse } from "@/lib/validation";
import { toPrismaStatus, toProduct } from "@/lib/productStatus";

// GET /api/admin/products — list all non-deleted products (ADMIN + SELLER)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const products = await prisma.product.findMany({
    where:   { deletedAt: null },
    include: { extraImages: { orderBy: { sortOrder: "asc" } }, sizes: true, variants: { include: { sizes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products.map(toProduct));
}

// POST /api/admin/products — create a product (ADMIN only)
export async function POST(req: NextRequest) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(productWriteSchema, body);
  if (err) return err;

  const product = await prisma.product.create({
    data: {
      name:            data.name,
      category:        data.category,
      price:           data.price,
      discountPercent: data.discountPercent ?? null,
      isBestSeller:    data.isBestSeller ?? false,
      stock:           data.stock,
      status:          toPrismaStatus(data.status),
      mainImage:       data.mainImage,
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

  return NextResponse.json(toProduct(product), { status: 201 });
}
