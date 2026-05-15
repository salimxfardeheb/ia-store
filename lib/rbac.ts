import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, JwtPayload } from "./auth";

type AuthResult = JwtPayload | NextResponse;

function extractUser(req: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

/** Requires ADMIN or SELLER role — for operations both roles can perform */
export function requireAdmin(req: NextRequest): AuthResult {
  const user = extractUser(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role !== "ADMIN" && user.role !== "SELLER") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return user;
}

/** Requires ADMIN role only — for owner-exclusive operations */
export function requireOwner(req: NextRequest): AuthResult {
  const user = extractUser(req);
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
