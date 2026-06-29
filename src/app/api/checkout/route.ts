import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, gt, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lots, orders, tickets } from "@/lib/db/schema";
import { checkoutSchema } from "@/lib/checkout-schema";
import { sendTicketEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confira os dados do formulário.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { items, buyer, participants } = parsed.data;

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  if (participants.length !== totalQty) {
    return NextResponse.json(
      { error: "A quantidade de participantes não corresponde à de ingressos." },
      { status: 400 },
    );
  }

  const lotIds = [...new Set(items.map((i) => i.lotId))];
  const lotRows = await db.select().from(lots).where(inArray(lots.id, lotIds));
  const lotMap = new Map(lotRows.map((l) => [l.id, l]));
  for (const item of items) {
    if (!lotMap.has(item.lotId)) {
      return NextResponse.json({ error: "Ingresso indisponível." }, { status: 400 });
    }
  }

  // One slot per ticket, in participant order.
  const slots = items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => lotMap.get(item.lotId)!),
  );
  const totalCents = slots.reduce((sum, lot) => sum + lot.priceCents, 0);

  try {
    const orderId = await db.transaction(async (tx) => {
      // Lock the lots to serialize concurrent purchases (anti-oversell).
      await tx.select({ id: lots.id }).from(lots).where(inArray(lots.id, lotIds)).for("update");

      // Count tickets already committed: paid OR pending+not-expired (reserved).
      const usedRows = await tx
        .select({ lotId: tickets.lotId, count: sql<number>`count(*)::int` })
        .from(tickets)
        .innerJoin(orders, eq(tickets.orderId, orders.id))
        .where(
          and(
            inArray(tickets.lotId, lotIds),
            or(
              eq(orders.status, "paid"),
              and(eq(orders.status, "pending"), gt(orders.expiresAt, new Date())),
            ),
          ),
        )
        .groupBy(tickets.lotId);
      const usedMap = new Map(usedRows.map((r) => [r.lotId, Number(r.count)]));

      const wanted = new Map<string, number>();
      for (const lot of slots) wanted.set(lot.id, (wanted.get(lot.id) ?? 0) + 1);
      for (const [lotId, qty] of wanted) {
        const lot = lotMap.get(lotId)!;
        const available = lot.qtyTotal - (usedMap.get(lotId) ?? 0);
        if (qty > available) {
          throw new Error(
            `Estoque insuficiente para ${lot.tierName} (${lot.label}). Restam ${Math.max(available, 0)}.`,
          );
        }
      }

      // No payment yet: mark as "cortesia". When Mercado Pago is wired in, this
      // becomes a pending order confirmed by the webhook/polling.
      const [order] = await tx
        .insert(orders)
        .values({
          buyerName: buyer.name,
          buyerCpf: buyer.cpf,
          buyerEmail: buyer.email,
          buyerWhatsapp: buyer.whatsapp,
          totalCents,
          status: "paid",
          paymentMethod: "cortesia",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        .returning({ id: orders.id });

      await tx.insert(tickets).values(
        slots.map((lot, i) => ({
          orderId: order.id,
          lotId: lot.id,
          tier: lot.tier,
          tierName: lot.tierName,
          holderName: participants[i].name,
          holderCpf: participants[i].cpf,
          priceCents: lot.priceCents,
          qrToken: randomUUID(),
        })),
      );

      return order.id;
    });

    // Envia o ingresso por e-mail (não bloqueia a emissão se falhar).
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
    try {
      const emailResult = await sendTicketEmail({
        to: buyer.email,
        buyerName: buyer.name,
        orderId,
        tickets: participants.map((p, i) => ({ holderName: p.name, tierName: slots[i].tierName })),
        baseUrl,
      });
      if (emailResult.sent) console.log(`[checkout] e-mail enviado para ${buyer.email}`);
      else console.warn(`[checkout] e-mail NAO enviado: ${emailResult.reason}`);
    } catch (e) {
      console.warn("[checkout] erro ao enviar e-mail:", e);
    }

    return NextResponse.json({ orderId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não foi possível gerar o pedido.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
