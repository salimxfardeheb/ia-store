import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, JwtPayload } from "./auth";
import { prisma } from "./prisma";
import { redis } from "./redis";
import { requireSameOrigin } from "./csrf";

type AuthResult = JwtPayload | NextResponse;
type Role = JwtPayload["role"];

/**
 * Lit le rôle courant depuis Redis (cache partagé entre instances serverless),
 * avec fallback DB sur cache miss ou panne Redis.
 *
 * Why: le JWT est signé 7 jours sans table de session — un admin démoté ou
 * supprimé garderait sinon ses droits jusqu'à expiration. La DB reste la
 * source de vérité, le cache absorbe les rafales.
 * Redis partagé élimine la fenêtre TTL × N instances du cache mémoire local.
 */
async function getCurrentRole(userId: string): Promise<Role | null> {
  try {
    const cached = await redis.get<string>(`role_cache:${userId}`);
    if (cached !== null) {
      return cached === "null" ? null : (cached as Role);
    }
  } catch {
    // Redis KO : fail open sur la lecture — on interroge la DB directement.
  }

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { role: true },
  });

  try {
    if (!user) {
      // TTL court pour les users inexistants : évite le marteau-piqûre DB sur
      // des tokens orphelins tout en limitant la fenêtre d'inconsistance.
      await redis.set(`role_cache:${userId}`, "null", { ex: 5 });
    } else {
      await redis.set(`role_cache:${userId}`, user.role, { ex: 30 });
    }
  } catch {
    // Redis KO à l'écriture : on continue sans cache, la DB a déjà répondu.
  }

  return user?.role ?? null;
}

export async function invalidateRoleCache(userId: string): Promise<void> {
  try {
    await redis.del(`role_cache:${userId}`);
  } catch {
    // Redis KO : la clé expirera naturellement dans ≤ 30 s.
  }
}

async function extractUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyToken(token);
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
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

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
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

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
