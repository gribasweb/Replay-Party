import { headers } from "next/headers";

/** Explicit canonical base URL from env, normalized to origin only. */
function envBase(): URL | null {
  const v = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!v) return null;

  try {
    const url = new URL(v);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Invalid protocol");
    }
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    throw new Error("NEXT_PUBLIC_BASE_URL must be a valid http(s) URL.");
  }
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function allowedHosts() {
  const hosts = new Set<string>();
  const configured = envBase();
  if (configured) {
    hosts.add(configured.host.toLowerCase());
    hosts.add(configured.hostname.toLowerCase());
  }

  for (const raw of (process.env.ALLOWED_PUBLIC_HOSTS ?? "").split(",")) {
    const host = raw.trim().toLowerCase();
    if (host) hosts.add(host);
  }

  return hosts;
}

function isLocalhost(hostname: string) {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".localhost");
}

function originFromHost(protoHeader: string | null, hostHeader: string | null) {
  const host = firstHeaderValue(hostHeader);
  const proto = firstHeaderValue(protoHeader) || "https";

  if (!host || /[\s/@\\]/.test(host)) return null;
  if (proto !== "https" && proto !== "http") return null;

  try {
    const url = new URL(`${proto}://${host}`);
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

function trustedOrigin(candidate: URL | null) {
  const configured = envBase();
  if (configured) return configured.origin;

  if (candidate) {
    const allow = allowedHosts();
    if (allow.has(candidate.host.toLowerCase()) || allow.has(candidate.hostname.toLowerCase())) {
      return candidate.origin;
    }

    if (process.env.NODE_ENV !== "production" && isLocalhost(candidate.hostname)) {
      return candidate.origin;
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_BASE_URL is required in production.");
  }

  return "http://localhost:3000";
}

/** Base URL for Route Handlers. Production requires a canonical env URL or host allowlist. */
export function baseUrlFromRequest(req: Request): string {
  const candidate =
    originFromHost(req.headers.get("x-forwarded-proto"), req.headers.get("x-forwarded-host")) ??
    originFromHost(null, req.headers.get("host")) ??
    new URL(req.url);

  return trustedOrigin(candidate);
}

/** Base URL for Server Components using the same trust policy as Route Handlers. */
export async function baseUrlFromHeaders(): Promise<string> {
  try {
    const h = await headers();
    const candidate =
      originFromHost(h.get("x-forwarded-proto"), h.get("x-forwarded-host")) ??
      originFromHost(null, h.get("host"));
    return trustedOrigin(candidate);
  } catch {
    return trustedOrigin(null);
  }
}
