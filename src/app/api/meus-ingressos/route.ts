import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; cpf?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const cpf = onlyDigits(body.cpf ?? "");

  if (!email || !isValidCPF(cpf)) {
    return NextResponse.json({ error: "Informe um e-mail e um CPF válidos." }, { status: 400 });
  }

  // Orders where this person is the BUYER (email + CPF must both match).
  const orderRows = await db
    .select({ id: orders.id, createdAt: orders.createdAt })
    .from(orders)
    .where(and(eq(orders.buyerEmail, email), eq(orders.buyerCpf, cpf), eq(orders.status, "paid")))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) {
    return NextResponse.json({ tickets: [] });
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

  return NextResponse.json({ tickets: ticketRows });
}
