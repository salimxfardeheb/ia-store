/**
 * Rate limiter Redis (Upstash) — partagé entre toutes les instances serverless.
 *
 * Why: la version Map en mémoire était contournable sur Vercel/Neon car
 * chaque cold start a sa propre mémoire ; un attaquant qui touche une
 * nouvelle instance recommence à zéro. Redis centralise le compteur.
 *
 * Algorithme : INCR + PEXPIRE NX dans un pipeline (un seul round-trip).
 *   - INCR est atomique → pas de race sur le compteur.
 *   - PEXPIRE NX ne pose la TTL que si la clé n'en a pas encore → la
 *     fenêtre est figée à la première requête et ne se prolonge pas
 *     tant qu'elle court (sliding window naïf évité).
 *   - PTTL nous donne le `retryAfter` exact pour le header HTTP.
 *
 * Fail-open : si Redis est injoignable on laisse passer et on log fort,
 * plutôt que de couper toutes les routes protégées par rate-limit (login,
 * commandes, etc.). Le monitoring doit alerter sur ces logs.
 */

import { redis } from "./redis";

const PREFIX = "rl:";

export async function checkRateLimit(
  key: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const fullKey = PREFIX + key;

  try {
    const results = await redis
      .pipeline()
      .incr(fullKey)
      .pexpire(fullKey, windowMs, "NX")
      .pttl(fullKey)
      .exec<[number, number, number]>();

    const count = results[0];
    const ttl   = results[2];

    if (count > max) {
      const remainMs = ttl > 0 ? ttl : windowMs;
      return { allowed: false, retryAfter: Math.ceil(remainMs / 1000) };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[rateLimit] Redis unreachable, failing open:", err);
    return { allowed: true };
  }
}

// Appelée après un login réussi pour qu'un utilisateur valide ne consomme
// pas son propre quota.
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await redis.del(PREFIX + key);
  } catch (err) {
    console.error("[rateLimit] Redis del failed:", err);
  }
}

/**
 * Dérive l'IP client de manière robuste contre le spoofing.
 *
 * Why: `x-forwarded-for` est un header positionnable par le client tant
 * qu'aucun proxy de confiance ne l'écrase. Un attaquant peut envoyer
 * `X-Forwarded-For: 1.2.3.4` pour échapper au rate-limit.
 *
 * On ne fait confiance qu'à des sources platform-controlled :
 *  - Vercel (`process.env.VERCEL === "1"`) : `x-vercel-forwarded-for` et
 *    `x-real-ip` sont posés par l'edge Vercel ; toute valeur fournie par
 *    le client est strippée avant que la requête atteigne la fonction.
 *  - Reverse-proxy générique : opt-in explicite via `TRUST_PROXY=1`,
 *    qui suppose que l'opérateur a configuré nginx/Caddy/etc. pour
 *    *écraser* `x-forwarded-for` (et pas l'append).
 *
 * En l'absence de source de confiance en production, on retourne
 * "unknown" — toutes les requêtes anonymes tombent dans un seul bucket,
 * ce qui maintient le rate-limit comme borne supérieure défensive.
 */
export function getClientIp(req: { headers: Headers }): string {
  if (process.env.VERCEL === "1") {
    const vercelFor = req.headers.get("x-vercel-forwarded-for");
    if (vercelFor) return vercelFor.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }

  if (process.env.TRUST_PROXY === "1") {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }

  // Dev: on accepte le header spoofable pour tester localement via curl.
  if (process.env.NODE_ENV !== "production") {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "dev"
    );
  }

  return "unknown";
}
