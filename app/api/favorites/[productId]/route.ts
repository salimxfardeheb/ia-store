import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { apiError, handleDbError } from "@/lib/validation";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

// DELETE /api/favorites/:productId — remove a favorite (idempotent)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = getUser(req);
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
