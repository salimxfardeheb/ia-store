import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "./auth";
import { prisma } from "./prisma";

export interface ServerSession {
  id:    string;
  email: string;
  name:  string;
  role:  "ADMIN" | "SELLER" | "CLIENT";
}

/**
 * Read and verify the auth cookie server-side (Server Components, layouts).
 * Validates the JWT, checks the Redis blocklist, then confirms the role in DB.
 * Returns null when the session is missing, invalid, or the user no longer exists.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const jar   = await cookies();
  const token = jar.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Confirm role from DB — catches demoted/deleted users even within JWT TTL
  const user = await prisma.user.findUnique({
    where:  { id: payload.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
