import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildAuthUrl, isSplitConfigured } from "@/lib/mp-vendor";
import { baseUrlFromRequest } from "@/lib/base-url";

export const runtime = "nodejs";

/**
 * Inicia a conexão da conta do organizador (OAuth). Protegido pela senha de
 * admin (?key=). Redireciona para a autorização do Mercado Pago e guarda um
 * `state` em cookie para validar o retorno (CSRF).
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!process.env.CHECKIN_PASSWORD || key !== process.env.CHECKIN_PASSWORD) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isSplitConfigured()) {
    return NextResponse.json(
      { error: "Split não configurado: faltam MP_CLIENT_ID e MP_CLIENT_SECRET." },
      { status: 503 },
    );
  }

  const state = randomUUID();
  const redirectUri = `${baseUrlFromRequest(req)}/api/mp/callback`;
  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state));
  res.cookies.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
