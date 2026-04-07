import { NextRequest, NextResponse } from "next/server";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
