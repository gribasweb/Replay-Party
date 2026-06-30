import "server-only";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function cleanPart(value: string) {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "").slice(0, 120) || "unknown";
}

export function clientKey(req: Request, scope: string) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    forwardedFor ??
    "unknown";

  return `${cleanPart(scope)}:${cleanPart(ip)}`;
}

export function rateLimit(key: string, opts: RateLimitOptions) {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) prune(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfter: 0 };
  }

  current.count += 1;
  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  if (current.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: opts.limit - current.count, retryAfter: 0 };
}
