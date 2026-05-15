import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireOwner, isNextResponse } from "@/lib/rbac";
import { userCreateSchema, safeParse, apiError, handleDbError } from "@/lib/validation";

const USER_SELECT = {
  id: true, name: true, email: true, role: true, createdAt: true,
} as const;

// GET /api/admin/users?q=<search>  (ADMIN only)
export async function GET(req: NextRequest) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SELLER"] },
      ...(q && {
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    select:  USER_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST /api/admin/users  (ADMIN only)
export async function POST(req: NextRequest) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(userCreateSchema, body);
  if (err) return err;

  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) return apiError("DUPLICATE", "Un compte avec cet email existe déjà", 409);

  try {
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data:   { name: data.name, email: data.email, password: hashed, role: data.role },
      select: USER_SELECT,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return handleDbError(e);
  }
}
