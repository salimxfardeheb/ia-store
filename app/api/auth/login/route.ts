import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rateLimit";
import { apiError } from "@/lib/validation";

// Pré-calculé une seule fois au démarrage : bcrypt.compare doit faire
// le travail complet même si l'email n'existe pas, sinon timing leak.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing-balance", 12);

export async function POST(req: NextRequest) {
  const ip  = getClientIp(req);
  const key = `login:${ip}`;

  // 10 attempts per 60-second window per IP
  const rl = checkRateLimit(key, { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques instants." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter ?? 60) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};

  if (!email || !password) {
    return apiError("VALIDATION_ERROR", "Champs manquants", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Hash valide (forme correcte + même coût 12) → bcrypt.compare prend le même
  // temps que sur un vrai utilisateur, contrairement à un hash malformé qui
  // serait rejeté immédiatement.
  const hash  = user?.password ?? DUMMY_HASH;
  const ok    = await bcrypt.compare(password, hash);
  const valid = !!user && ok;

  if (!valid || !user) {
    // Generic message — never reveal whether the email exists
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  // Successful login — clear the rate-limit window for this IP
  resetRateLimit(key);

  const token = signToken({
    id:    user.id,
    email: user.email,
    name:  user.name,
    role:  user.role as "ADMIN" | "SELLER" | "CLIENT",
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
  return res;
}
