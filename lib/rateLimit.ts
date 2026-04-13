/**
 * Simple in-memory rate limiter.
 * Works correctly for single-instance deployments.
 * For multi-instance / edge deployments replace the Map with a Redis store (e.g. @upstash/ratelimit).
 */

interface Slot { count: number; resetAt: number }

const store = new Map<string, Slot>();

// Prune expired entries every minute to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, slot] of store) {
    if (slot.resetAt <= now) store.delete(key);
  }
}, 60_000);

export function checkRateLimit(
  key: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {}
): { allowed: boolean; retryAfter?: number } {
  const now  = Date.now();
  const slot = store.get(key);

  if (!slot || slot.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (slot.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((slot.resetAt - now) / 1000) };
  }

  slot.count += 1;
  return { allowed: true };
}

// Call on successful login so a valid user doesn't hit their own window
export function resetRateLimit(key: string): void {
  store.delete(key);
}
