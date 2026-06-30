import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { baseUrlFromRequest } from "@/lib/base-url";
import { buildAuthUrl, isSplitConfigured } from "@/lib/mp-vendor";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  if (!isSplitConfigured()) {
    return NextResponse.json(
      { error: "Split nao configurado: faltam MP_CLIENT_ID e MP_CLIENT_SECRET." },
      { status: 503 },
    );
  }

  const state = randomUUID();
  const redirectUri = `${baseUrlFromRequest(req)}/api/mp/callback`;
  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state));
  res.cookies.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
