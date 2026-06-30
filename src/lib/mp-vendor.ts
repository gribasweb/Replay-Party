import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mpCredentials, type MpCredentials } from "@/lib/db/schema";

/**
 * Split de Pagamentos (marketplace) do Mercado Pago.
 *
 * A aplicação "Gustavo-Party" é o marketplace (fica com a comissão). O
 * organizador conecta a conta dele via OAuth; a partir daí os pagamentos são
 * criados na conta DELE com o nosso `application_fee`, e o Mercado Pago divide
 * automaticamente: organizador recebe o líquido, nós recebemos a comissão.
 */

const CLIENT_ID = process.env.MP_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.MP_CLIENT_SECRET ?? "";

/** Percentual da comissão do marketplace (Gustavo-Party). */
export const COMMISSION_RATE = 0.15;

export function isSplitConfigured(): boolean {
  return CLIENT_ID.length > 0 && CLIENT_SECRET.length > 0;
}

interface MpTokenResponse {
  access_token: string;
  refresh_token?: string;
  public_key?: string;
  user_id?: number | string;
  expires_in?: number;
  live_mode?: boolean;
}

/** URL para o organizador autorizar a conexão da conta dele. */
export function buildAuthUrl(redirectUri: string, state: string): string {
  const u = new URL("https://auth.mercadopago.com.br/authorization");
  u.searchParams.set("client_id", CLIENT_ID);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("platform_id", "mp");
  u.searchParams.set("state", state);
  u.searchParams.set("redirect_uri", redirectUri);
  return u.toString();
}

async function postToken(payload: Record<string, string>): Promise<MpTokenResponse> {
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...payload }),
  });
  const data = (await res.json().catch(() => ({}))) as MpTokenResponse & { message?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`OAuth Mercado Pago falhou (${res.status}): ${data.message ?? JSON.stringify(data)}`);
  }
  return data;
}

/** Troca o `code` do callback pelo access_token do vendedor e persiste. */
export async function exchangeCodeAndSave(code: string, redirectUri: string): Promise<MpCredentials> {
  const t = await postToken({ code, grant_type: "authorization_code", redirect_uri: redirectUri });
  return persist(t);
}

async function persist(t: MpTokenResponse): Promise<MpCredentials> {
  const expiresAt = t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null;
  const values = {
    id: "vendor",
    mpUserId: t.user_id != null ? String(t.user_id) : null,
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? null,
    publicKey: t.public_key ?? null,
    expiresAt,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(mpCredentials)
    .values(values)
    .onConflictDoUpdate({ target: mpCredentials.id, set: values })
    .returning();
  return row;
}

export async function getVendorCredentials(): Promise<MpCredentials | null> {
  const [row] = await db.select().from(mpCredentials).where(eq(mpCredentials.id, "vendor"));
  return row ?? null;
}

/**
 * Retorna um access_token do vendedor válido, renovando via refresh_token se
 * estiver perto de expirar. Retorna null se não houver conta conectada.
 */
export async function getValidVendorToken(): Promise<{ accessToken: string; publicKey: string | null } | null> {
  const cred = await getVendorCredentials();
  if (!cred) return null;

  const nearExpiry = cred.expiresAt != null && cred.expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  if (nearExpiry && cred.refreshToken) {
    try {
      const t = await postToken({ grant_type: "refresh_token", refresh_token: cred.refreshToken });
      const updated = await persist(t);
      return { accessToken: updated.accessToken, publicKey: updated.publicKey };
    } catch {
      // Se o refresh falhar, segue com o token atual (pode ainda funcionar).
    }
  }
  return { accessToken: cred.accessToken, publicKey: cred.publicKey };
}
