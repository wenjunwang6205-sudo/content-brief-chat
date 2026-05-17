const windowMs = 60_000;
const maxRequests = Number(process.env.RATE_LIMIT_PER_MIN ?? 10);
const store = globalThis.__rateLimitStore ?? new Map();
globalThis.__rateLimitStore = store;

export function checkRateLimit(ip) {
  const key = ip ?? "unknown";
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 };
  }
  entry.count += 1;
  store.set(key, entry);
  if (entry.count > maxRequests) {
    return { ok: false, retryAfterSec: Math.ceil((entry.start + windowMs - now) / 1000) };
  }
  return { ok: true, remaining: maxRequests - entry.count };
}
