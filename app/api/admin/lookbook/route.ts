import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireOwner, isNextResponse } from "@/lib/rbac";
import { apiError } from "@/lib/validation";
import { z } from "zod";

const lookbookSchema = z.object({
  title:       z.string().min(1).max(80),
  tag:         z.string().max(40).default(""),
  description: z.string().max(300).default(""),
  imageUrl:    z.string().url(),
  accent:      z.string().default("#1a1713"),
  sortOrder:   z.number().int().default(0),
  active:      z.boolean().default(true),
  productIds:  z.array(z.string()).default([]),
});

// GET /api/admin/lookbook — liste tous les looks
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const looks = await prisma.lookBook.findMany({
    orderBy: { sortOrder: "asc" },
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

  return NextResponse.json(looks);
}

// POST /api/admin/lookbook — créer un look
export async function POST(req: NextRequest) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const parsed = lookbookSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Données invalides", 400);
  }

  const { productIds, ...data } = parsed.data;

  const look = await prisma.lookBook.create({
    data: {
      ...data,
      products: {
        create: productIds.map((productId, i) => ({ productId, sortOrder: i })),
      },
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

  return NextResponse.json(look, { status: 201 });
}
