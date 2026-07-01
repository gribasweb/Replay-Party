import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { baseUrlFromRequest } from "@/lib/base-url";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { sendTicketEmail } from "@/lib/email";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

/**
 * Reenvia o e-mail de um pedido JÁ PAGO com os MESMOS ingressos/QR — não gera
 * ingresso novo nem token novo, então nada duplica. Útil para quem recebeu num
 * formato antigo ou não recebeu. Aceita { orderId } ou { email } (nesse caso,
 * o pedido pago mais recente daquele e-mail). Protegido pela sessão de operador.
 */
export async function POST(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => null)) as { orderId?: string; email?: string } | null;
  if (!body || (!body.orderId && !body.email)) {
    return NextResponse.json({ error: "Informe orderId ou email." }, { status: 400 });
  }

  const cols = {
    id: orders.id,
    email: orders.buyerEmail,
    name: orders.buyerName,
    status: orders.status,
  };

  let order;
  if (body.orderId) {
    [order] = await db.select(cols).from(orders).where(eq(orders.id, body.orderId));
  } else if (body.email) {
    [order] = await db
      .select(cols)
      .from(orders)
      .where(and(eq(orders.buyerEmail, body.email), eq(orders.status, "paid")))
      .orderBy(desc(orders.createdAt))
      .limit(1);
  }

  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (order.status !== "paid") {
    return NextResponse.json({ error: "Pedido não está pago; nada a reenviar." }, { status: 400 });
  }

  const ticketRows = await db
    .select({ holderName: tickets.holderName, tierName: tickets.tierName, qrToken: tickets.qrToken })
    .from(tickets)
    .where(eq(tickets.orderId, order.id));

  if (ticketRows.length === 0) {
    return NextResponse.json({ error: "Pedido sem ingressos." }, { status: 400 });
  }

  const baseUrl = baseUrlFromRequest(req);
  const result = await sendTicketEmail({
    to: order.email,
    buyerName: order.name,
    orderId: order.id,
    tickets: ticketRows,
    baseUrl,
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.reason ?? "Falha ao enviar." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, to: order.email, orderId: order.id, tickets: ticketRows.length });
}
