import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, authCookieOptions, getTokenFromRequest, revokeToken } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

// POST /api/auth/logout — revoke the JWT in Redis, then clear the cookie
export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const token = getTokenFromRequest(req);
  let revoked = false;

  if (token) {
    try {
      await revokeToken(token);
      revoked = true;
    } catch (err) {
      const jti = (jwt.decode(token) as Record<string, unknown> | null)?.jti ?? "unknown";
      console.error("logout: Redis revocation failed", { jti, err });
      // Cookie is cleared below regardless — user is logged out of the UI.
    }
  }

  const res = NextResponse.json({ ok: true, revoked });
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions(),
    maxAge: 0,
  });
  return res;
}
