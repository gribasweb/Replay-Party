import { headers } from "next/headers";

/** Base URL explícita (env), normalizada — ou null se ausente/vazia. */
function envBase(): string | null {
  const v = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  return v ? v.replace(/\/+$/, "") : null;
}

/**
 * Base URL para Route Handlers (têm o Request). Usa a env se definida,
 * senão o host público dos headers de proxy. Atrás de um proxy reverso
 * (nginx no VPS), `req.url` traz o host INTERNO (localhost:3000); o domínio
 * real chega em `x-forwarded-host`. Por isso priorizamos os headers e só
 * caímos no `req.url` se não houver nenhum host (ambiente sem proxy).
 */
export function baseUrlFromRequest(req: Request): string {
  const fromEnv = envBase();
  if (fromEnv) return fromEnv;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
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
