import { headers } from "next/headers";

/** Base URL explícita (env), normalizada — ou null se ausente/vazia. */
function envBase(): string | null {
  const v = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  return v ? v.replace(/\/+$/, "") : null;
}

/**
 * Base URL para Route Handlers (têm o Request). Usa a env se definida,
 * senão o próprio origin da requisição (cobre qualquer domínio/preview).
 */
export function baseUrlFromRequest(req: Request): string {
  return envBase() ?? new URL(req.url).origin;
}

/**
 * Base URL para Server Components (sem Request). Usa a env se definida,
 * senão monta a partir dos headers de proxy da requisição atual.
 */
export async function baseUrlFromHeaders(): Promise<string> {
  const fromEnv = envBase();
  if (fromEnv) return fromEnv;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* sem contexto de request */
  }
  return "http://localhost:3000";
}
