import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { customerWriteSchema, safeParse, apiError } from "@/lib/validation";

// GET /api/admin/customers?q=<search> (ADMIN + SELLER)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

// POST /api/admin/customers (ADMIN + SELLER)
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(customerWriteSchema, body);
  if (err) return err;

  const { name, phone, email, address } = data;

  const existing = await prisma.customer.findUnique({
    where: { phone: phone.trim() },
  });
  if (existing) {
    return apiError("DUPLICATE_PHONE", "Un client avec ce numéro de téléphone existe déjà", 409);
  }

  const customer = await prisma.customer.create({
    data: {
      name:    name.trim(),
      phone:   phone.trim(),
      email:   email?.trim()   || null,
      address: address?.trim() || null,
    },
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json(customer, { status: 201 });
}
