import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import { apiError } from "@/lib/validation";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

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

  // Use constant-time comparison regardless of whether the user exists
  const hash  = user?.password ?? "$2a$12$invalidhashtopreventtimingattacks000000000000000000";
  const valid = user ? await bcrypt.compare(password, hash) : (await bcrypt.compare(password, hash), false);

  if (!user || !valid) {
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

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
