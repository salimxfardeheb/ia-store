import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwner, isNextResponse } from "@/lib/rbac";
import { apiError } from "@/lib/validation";
import { z } from "zod";

const lookbookUpdateSchema = z.object({
  title:       z.string().min(1).max(80).optional(),
  tag:         z.string().max(40).optional(),
  description: z.string().max(300).optional(),
  imageUrl:    z.string().url().optional(),
  accent:      z.string().optional(),
  sortOrder:   z.number().int().optional(),
  active:      z.boolean().optional(),
  productIds:  z.array(z.string()).optional(),
});

// GET /api/admin/lookbook/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  const look = await prisma.lookBook.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: { id: true, name: true, mainImage: true, category: true, price: true },
          },
        },
      },
    },
  });

  if (!look) return apiError("NOT_FOUND", "Look introuvable", 404);
  return NextResponse.json(look);
}

// PUT /api/admin/lookbook/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = lookbookUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Données invalides", 400);
  }

  const { productIds, ...data } = parsed.data;

  const look = await prisma.lookBook.update({
    where: { id },
    data: {
      ...data,
      ...(productIds !== undefined && {
        products: {
          deleteMany: {},
          create: productIds.map((productId, i) => ({ productId, sortOrder: i })),
        },
      }),
    },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: { id: true, name: true, mainImage: true, category: true, price: true },
          },
        },
      },
    },
  });

  return NextResponse.json(look);
}

// DELETE /api/admin/lookbook/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  await prisma.lookBook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
