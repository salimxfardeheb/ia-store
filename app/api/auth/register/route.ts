import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { apiError, handleDbError } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/csrf";

const registerSchema = z.object({
  email:    z.string().email("Email invalide"),
  name:     z.string().min(1, "Nom requis").max(200),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // 5 inscriptions par minute / IP — empêche le flood de comptes
  const rl = await checkRateLimit(`register:${getClientIp(req)}`, { max: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  const body = await req.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Données invalides",
      400
    );
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("DUPLICATE", "Email déjà utilisé", 409);
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data:   { email, name, password: hashed },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = signToken({
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role as "ADMIN" | "SELLER" | "CLIENT",
    });

    const res = NextResponse.json({ user }, { status: 201 });
    res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return res;
  } catch (err) {
    return handleDbError(err);
  }
}
