import { NextRequest, NextResponse } from "next/server";
import { apiError } from "./validation";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hostOf(urlOrOrigin: string): string | null {
  try {
    return new URL(urlOrOrigin).host;
  } catch {
    return null;
  }
}

/**
 * Défense en profondeur contre le CSRF : vérifie que l'origine d'une
 * requête mutable correspond au site (même host que celui de la requête,
 * ou domaine configuré dans NEXT_PUBLIC_SITE_URL / VERCEL_URL).
 *
 * Why: `sameSite: "lax"` bloque déjà les cookies sur POST cross-origin
 * dans les navigateurs modernes, mais ce check couvre aussi :
 *  - vieux navigateurs (fenêtre Lax+POST 2 min pour cookies frais)
 *  - sous-domaines XSS-compromis (same-site ≠ same-origin)
 *  - requêtes sans cookies mais avec side-effects (ex. flowmerce-url)
 *
 * No-op pour GET/HEAD/OPTIONS. À appeler en tout premier dans chaque
 * route mutable, avant `requireAdmin` / auth, pour rejeter au plus tôt.
 */
export function requireSameOrigin(req: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(req.method)) return null;

  const originHeader = req.headers.get("origin") ?? req.headers.get("referer");
  if (!originHeader) {
    return apiError("CSRF_FORBIDDEN", "Origine manquante", 403);
  }

  const allowedHosts = new Set<string>();

  const requestHost = req.headers.get("host");
  if (requestHost) allowedHosts.add(requestHost);

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const h = hostOf(process.env.NEXT_PUBLIC_SITE_URL);
    if (h) allowedHosts.add(h);
  }

  if (process.env.VERCEL_URL) allowedHosts.add(process.env.VERCEL_URL);

  const originHost = hostOf(originHeader);
  if (!originHost || !allowedHosts.has(originHost)) {
    return apiError("CSRF_FORBIDDEN", "Origine non autorisée", 403);
  }

  return null;
}
