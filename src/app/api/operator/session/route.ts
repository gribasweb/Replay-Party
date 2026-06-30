import { NextResponse } from "next/server";
import { clearOperatorSession, hasOperatorSession, issueOperatorSession, verifyOperatorPassword } from "@/lib/operator-session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return NextResponse.json({ ok: hasOperatorSession(req) });
}

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "operator-login"), { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (!verifyOperatorPassword(body.password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  issueOperatorSession(res);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearOperatorSession(res);
  return res;
}
