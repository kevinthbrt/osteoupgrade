type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Simple in-memory rate limiter.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 *
 * Note: resets per window (fixed window counter). For a single-instance
 * deployment this is sufficient. For multi-instance, swap the store for
 * a shared cache (Redis / Upstash).
 */
export function rateLimit(
  identifier: string,
  { limit = 10, windowSeconds = 60 }: { limit?: number; windowSeconds?: number } = {}
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = store.get(identifier)

  if (!existing || existing.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  existing.count += 1
  return { allowed: true }
}
