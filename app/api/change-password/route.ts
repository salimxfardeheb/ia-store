import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { changePasswordSchema, safeParse, apiError, handleDbError } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Double bucket : par userId ET par IP — un attaquant avec plusieurs
  // sessions volées du même compte ne contourne pas la limite par IP,
  // et plusieurs IPs ne contournent pas la limite par compte.
  const ip   = getClientIp(req);
  const rlUser = await checkRateLimit(`pwchange:user:${user.id}`, { max: 5,  windowMs: 60_000 });
  const rlIp   = await checkRateLimit(`pwchange:ip:${ip}`,        { max: 10, windowMs: 60_000 });
  const rl = rlUser.allowed ? rlIp : rlUser;
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

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
