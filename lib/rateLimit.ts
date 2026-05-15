/**
 * Simple in-memory rate limiter.
 *
 * Works correctly for single-instance deployments. For multi-instance / edge
 * deployments replace the Map with a Redis store (e.g. @upstash/ratelimit).
 *
 * The store + sweep timer are attached to `globalThis` so Next's dev hot
 * reload doesn't accumulate dozens of intervals (one per HMR boot).
 */

interface Slot { count: number; resetAt: number }

interface RateLimitGlobals {
  store: Map<string, Slot>;
  timer: NodeJS.Timeout | null;
}

const g = globalThis as unknown as { __rateLimit?: RateLimitGlobals };

if (!g.__rateLimit) {
  g.__rateLimit = { store: new Map(), timer: null };
}

const store = g.__rateLimit.store;

// Prune expired entries every minute. Guarded against HMR double-init.
if (!g.__rateLimit.timer) {
  g.__rateLimit.timer = setInterval(() => {
    const now = Date.now();
    for (const [key, slot] of store) {
      if (slot.resetAt <= now) store.delete(key);
    }
  }, 60_000);
  // Don't keep the process alive just for the sweeper
  g.__rateLimit.timer.unref?.();
}

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

// Helper to derive a stable client IP for rate-limit keys.
export function getClientIp(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
