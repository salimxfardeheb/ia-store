import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be set in environment variables (minimum 32 characters). " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}

export interface JwtPayload {
  id:    string;
  email: string;
  name:  string;
  role:  "ADMIN" | "SELLER" | "CLIENT";
}

export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const AUTH_COOKIE_NAME = "ia_session";

/** Options for the auth cookie. Secure only in production (HTTPS). */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   TOKEN_MAX_AGE_SECONDS,
  };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: `${TOKEN_MAX_AGE_SECONDS}s` });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Read the JWT from the HttpOnly cookie first, then fall back to the
 * Authorization header for backwards compatibility with any caller that
 * still passes a Bearer token.
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  return getTokenFromHeader(req.headers.get("Authorization"));
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "");
}
