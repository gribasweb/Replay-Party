import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { baseUrlFromRequest } from "@/lib/base-url";
import { db } from "@/lib/db";
import { lots, orders, tickets } from "@/lib/db/schema";
import { fulfillOrder } from "@/lib/fulfill";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

interface Person {
  name: string;
  cpf: string;
  email: string;
}

export async function POST(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => null)) as {
    lotId?: string;
    tier?: string;
    people?: Person[];
  } | null;
  if (!body || !Array.isArray(body.people) || body.people.length === 0) {
    return NextResponse.json({ error: "Informe o setor e ao menos uma pessoa." }, { status: 400 });
  }

  // Resolve o lote: por id explícito, ou o lote ATIVO do setor (por data).
  let lot;
  if (body.lotId) {
    [lot] = await db.select().from(lots).where(eq(lots.id, body.lotId));
  } else if (body.tier === "pista" || body.tier === "vip") {
    const now = new Date();
    const rows = await db.select().from(lots).where(eq(lots.tier, body.tier)).orderBy(lots.lotNumber);
    lot =
      rows.find((l) => (!l.startsAt || l.startsAt <= now) && (!l.endsAt || l.endsAt >= now)) ??
      rows[rows.length - 1];
  }
  if (!lot) return NextResponse.json({ error: "Setor/lote nao encontrado." }, { status: 400 });

  const baseUrl = baseUrlFromRequest(req);
  const results: { name: string; email: string; orderId: string }[] = [];

  for (const person of body.people) {
    const [order] = await db
      .insert(orders)
      .values({
        buyerName: person.name,
        buyerCpf: person.cpf,
        buyerEmail: person.email,
        buyerWhatsapp: "",
        totalCents: 0,
        status: "pending",
        paymentMethod: "cortesia",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .returning({ id: orders.id });

    await db.insert(tickets).values({
      orderId: order.id,
      lotId: lot.id,
      tier: lot.tier,
      tierName: lot.tierName,
      holderName: person.name,
      holderCpf: person.cpf,
      priceCents: 0,
      qrToken: randomUUID(),
    });

    await fulfillOrder(order.id, { method: "cortesia", baseUrl });
    results.push({ name: person.name, email: person.email, orderId: order.id });
  }

  return NextResponse.json({ ok: true, count: results.length, results });
}
