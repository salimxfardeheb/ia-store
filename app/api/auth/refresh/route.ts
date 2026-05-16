import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  getTokenFromRequest,
  revokeToken,
  signToken,
  verifyToken,
  shouldRefresh,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// POST /api/auth/refresh — sliding session: issue a new token if the current
// one is still valid but approaching expiry. The old token is revoked in Redis.
export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // ─── Rate-limit IP : bloque le flood avant tout décodage de token ────────
  // 20 refresh / min / IP — seuil généreux pour les clients légitimes mais
  // suffisant pour absorber les attaques sans token valide.
  const ipRl = await checkRateLimit(`refresh:ip:${getClientIp(req)}`, { max: 20, windowMs: 60_000 });
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(ipRl.retryAfter ?? 60) } }
    );
  }

  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });

  // ─── Rate-limit userId : 10 refresh / min par compte ─────────────────────
  const userRl = await checkRateLimit(`refresh:user:${payload.id}`, { max: 10, windowMs: 60_000 });
  if (!userRl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(userRl.retryAfter ?? 60) } }
    );
  }

  // Only refresh if the token is actually close to expiry — avoids unnecessary
  // Redis writes when the client calls this on every focus event.
  if (!shouldRefresh(payload)) {
    return NextResponse.json({ ok: true, refreshed: false });
  }

  // Confirm the user still exists and hasn't been deactivated
  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Revoke old token, issue a fresh one
  await revokeToken(token);
  const newToken = signToken({
    id:    user.id,
    email: user.email,
    name:  user.name,
    role:  user.role as "ADMIN" | "SELLER" | "CLIENT",
  });

  const res = NextResponse.json({ ok: true, refreshed: true });
  res.cookies.set(AUTH_COOKIE_NAME, newToken, authCookieOptions());
  return res;
}
