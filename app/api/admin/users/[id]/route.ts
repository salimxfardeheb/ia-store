import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, isNextResponse, invalidateRoleCache } from "@/lib/rbac";
import { userRoleSchema, safeParse, apiError, handleDbError } from "@/lib/validation";
import { audit } from "@/lib/audit";

const USER_SELECT = {
  id: true, name: true, email: true, role: true, createdAt: true,
} as const;

// PATCH /api/admin/users/[id]  — update role (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(userRoleSchema, body);
  if (err) return err;

  // Prevent an admin from demoting themselves
  if (auth.id === id && data.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Vous ne pouvez pas modifier votre propre rôle", 403);
  }

  try {
    const before = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    const user = await prisma.user.update({
      where:  { id },
      data:   { role: data.role },
      select: USER_SELECT,
    });
    invalidateRoleCache(id);
    audit(auth.id, "user.role_changed", "User", id, {
      before: before?.role,
      after:  data.role,
    });
    return NextResponse.json(user);
  } catch (e) {
    return handleDbError(e);
  }
}

// DELETE /api/admin/users/[id]  (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOwner(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  if (auth.id === id) {
    return apiError("FORBIDDEN", "Vous ne pouvez pas supprimer votre propre compte", 403);
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
    await prisma.user.delete({ where: { id } });
    invalidateRoleCache(id);
    audit(auth.id, "user.deleted", "User", id, {
      before: { email: target?.email, role: target?.role },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleDbError(e);
  }
}
