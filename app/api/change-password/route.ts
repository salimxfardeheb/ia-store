import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { changePasswordSchema, safeParse, apiError, handleDbError } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(changePasswordSchema, body);
  if (err) return err;

  try {
    const dbUser = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { id: true, password: true },
    });

    if (!dbUser) return apiError("NOT_FOUND", "Utilisateur introuvable", 404);

    const valid = await bcrypt.compare(data.currentPassword, dbUser.password);
    if (!valid) return apiError("INVALID_PASSWORD", "Mot de passe actuel incorrect", 400);

    const hashed = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: dbUser.id },
      data:  { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleDbError(err);
  }
}
