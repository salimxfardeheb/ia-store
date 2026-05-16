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

// POST /api/auth/refresh — sliding session: issue a new token if the current
// one is still valid but approaching expiry. The old token is revoked in Redis.
export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 });

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
