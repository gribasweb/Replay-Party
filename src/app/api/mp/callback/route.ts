import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeAndSave } from "@/lib/mp-vendor";
import { baseUrlFromRequest } from "@/lib/base-url";

export const runtime = "nodejs";

/**
 * Retorno do OAuth do Mercado Pago. Valida o `state`, troca o `code` pelo
 * access_token do organizador, persiste e volta para a tela de admin.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const base = baseUrlFromRequest(req);

  const jar = await cookies();
  const savedState = jar.get("mp_oauth_state")?.value;

  if (!code) {
    return NextResponse.redirect(`${base}/admin/mp?error=sem_code`);
  }
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${base}/admin/mp?error=state`);
  }

  try {
    await exchangeCodeAndSave(code, `${base}/api/mp/callback`);
    const res = NextResponse.redirect(`${base}/admin/mp?connected=1`);
    res.cookies.delete("mp_oauth_state");
    return res;
  } catch (e) {
    console.error("[mp/callback] erro ao trocar code:", e);
    return NextResponse.redirect(`${base}/admin/mp?error=token`);
  }
}
