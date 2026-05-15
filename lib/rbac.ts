import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, JwtPayload } from "./auth";
import { prisma } from "./prisma";

type AuthResult = JwtPayload | NextResponse;
type Role = JwtPayload["role"];

const ROLE_CACHE_TTL_MS = 30_000;
const roleCache = new Map<string, { role: Role | null; expiresAt: number }>();

/**
 * Lit le rôle courant en base, avec un cache mémoire de 30 s par userId.
 *
 * Why: le JWT est signé 7 jours sans table de session — un admin démoté ou
 * supprimé garderait sinon ses droits jusqu'à expiration. La DB reste la
 * source de vérité, le cache absorbe les rafales.
 *
 * Limite connue: en serverless multi-instances, la révocation est globalement
 * bornée par TTL × N instances chaudes. Pour un effet immédiat, appeler
 * `invalidateRoleCache(userId)` au moment du PATCH/DELETE.
 */
async function getCurrentRole(userId: string): Promise<Role | null> {
  const now = Date.now();
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.role;

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { role: true },
  });
  const role = user?.role ?? null;
  roleCache.set(userId, { role, expiresAt: now + ROLE_CACHE_TTL_MS });
  return role;
}

export function invalidateRoleCache(userId: string): void {
  roleCache.delete(userId);
}

async function extractUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const currentRole = await getCurrentRole(payload.id);
  if (!currentRole) return null;
  if (currentRole !== payload.role) {
    return { ...payload, role: currentRole };
  }
  return payload;
}

/** Requires ADMIN or SELLER role — for operations both roles can perform */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const user = await extractUser(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role !== "ADMIN" && user.role !== "SELLER") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return user;
}

/** Requires ADMIN role only — for owner-exclusive operations */
export async function requireOwner(req: NextRequest): Promise<AuthResult> {
  const user = await extractUser(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accès réservé au propriétaire" },
      { status: 403 }
    );
  }
  return user;
}

/** Type guard: tells TypeScript whether the result is an error response */
export function isNextResponse(val: AuthResult): val is NextResponse {
  return val instanceof NextResponse;
}
