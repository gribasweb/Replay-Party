import { randomInt } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { isEmailConfigured, sendLookupCodeEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  clearLookupChallengeCookie,
  setLookupChallengeCookie,
  verifyLookupChallenge,
} from "@/lib/ticket-lookup-session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "ticket-lookup"), { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string; cpf?: string; code?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const cpf = onlyDigits(body.cpf ?? "");
  const code = onlyDigits(body.code ?? "");

  if (!email || !isValidCPF(cpf)) {
    return NextResponse.json({ error: "Informe um e-mail e um CPF validos." }, { status: 400 });
  }

  const orderRows = await db
    .select({ id: orders.id, createdAt: orders.createdAt })
    .from(orders)
    .where(and(eq(orders.buyerEmail, email), eq(orders.buyerCpf, cpf), eq(orders.status, "paid")))
    .orderBy(desc(orders.createdAt));

  if (!code) {
    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Envio de e-mail nao configurado." }, { status: 503 });
    }

    const res = NextResponse.json({ ok: true, step: "code_sent" });
    if (orderRows.length > 0) {
      const lookupCode = String(randomInt(0, 1000000)).padStart(6, "0");
      const sent = await sendLookupCodeEmail({ to: email, code: lookupCode });
      if (!sent.sent) {
        console.error(`[meus-ingressos] falha ao enviar codigo para ${email}: ${sent.reason}`);
        return NextResponse.json({ error: "Nao foi possivel enviar o codigo agora." }, { status: 503 });
      }
      setLookupChallengeCookie(res, email, cpf, lookupCode);
    }
    return res;
  }

  if (code.length !== 6 || !verifyLookupChallenge(req, email, cpf, code)) {
    return NextResponse.json({ error: "Codigo invalido ou expirado." }, { status: 401 });
  }

  if (orderRows.length === 0) {
    const res = NextResponse.json({ tickets: [] });
    clearLookupChallengeCookie(res);
    return res;
  }

  const orderIds = orderRows.map((o) => o.id);
  const ticketRows = await db
    .select({
      token: tickets.qrToken,
      holderName: tickets.holderName,
      tierName: tickets.tierName,
      status: tickets.status,
    })
    .from(tickets)
    .where(inArray(tickets.orderId, orderIds));

  const res = NextResponse.json({ tickets: ticketRows });
  clearLookupChallengeCookie(res);
  return res;
}
