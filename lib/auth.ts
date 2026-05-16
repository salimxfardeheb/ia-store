import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { redis } from "./redis";

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
  jti:   string;
  exp?:  number;
}

export const TOKEN_MAX_AGE_SECONDS  = 60 * 15;      // 15 minutes
export const TOKEN_REFRESH_THRESHOLD = 60 * 5;       // refresh when < 5 min left
export const AUTH_COOKIE_NAME        = "ia_session";

function blockedKey(jti: string) {
  return `blocked_token:${jti}`;
}

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

export function signToken(payload: Omit<JwtPayload, "jti">): string {
  const jti = randomUUID();
  return jwt.sign({ ...payload, jti }, JWT_SECRET!, { expiresIn: `${TOKEN_MAX_AGE_SECONDS}s` });
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }

  // Reject tokens that have been explicitly revoked on logout
  const blocked = await redis.get(blockedKey(payload.jti));
  if (blocked) return null;

  return payload;
}

/** Call on logout — blocks this token in Redis until it would have expired. */
export async function revokeToken(token: string): Promise<void> {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return; // already invalid — nothing to revoke
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = (payload.exp ?? now + TOKEN_MAX_AGE_SECONDS) - now;
  if (ttl > 0) {
    await redis.set(blockedKey(payload.jti), "1", { ex: ttl });
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

/** True if the token expires within TOKEN_REFRESH_THRESHOLD seconds. */
export function shouldRefresh(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  const secsLeft = payload.exp - Math.floor(Date.now() / 1000);
  return secsLeft < TOKEN_REFRESH_THRESHOLD;
}
