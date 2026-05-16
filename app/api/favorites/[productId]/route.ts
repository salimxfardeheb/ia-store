import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { apiError, handleDbError } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/csrf";

async function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

// DELETE /api/favorites/:productId — remove a favorite (idempotent)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const user = await getUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Non autorisé", 401);

  const { productId } = await params;
  if (!productId) {
    return apiError("VALIDATION_ERROR", "ID produit requis", 400);
  }

  try {
    await prisma.favorite.deleteMany({
      where: { userId: user.id, productId },
    });
  } catch (err) {
    return handleDbError(err);
  }

  return NextResponse.json({ ok: true });
}
