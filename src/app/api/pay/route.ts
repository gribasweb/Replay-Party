import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isMpConfigured, mpPayment } from "@/lib/mercadopago";
import { fulfillOrder } from "@/lib/fulfill";

export const runtime = "nodejs";

interface BrickFormData {
  token?: string;
  payment_method_id?: string;
  installments?: number;
  issuer_id?: string;
}

export async function POST(req: Request) {
  if (!isMpConfigured()) {
    return NextResponse.json({ error: "Pagamento não configurado." }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { orderId?: string; formData?: BrickFormData };
  const { orderId, formData } = body;
  if (!orderId || !formData?.payment_method_id) {
    return NextResponse.json({ error: "Dados de pagamento ausentes." }, { status: 400 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ status: "approved", orderId });
  if (order.status !== "pending" || order.expiresAt < new Date()) {
    return NextResponse.json({ error: "Sua reserva expirou. Refaça o pedido." }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const isPix = formData.payment_method_id === "pix";

  try {
    const result = await mpPayment.create({
      body: {
        transaction_amount: order.totalCents / 100,
        description: "Ingressos Replay Party",
        external_reference: orderId,
        payment_method_id: formData.payment_method_id,
        token: formData.token,
        installments: formData.installments,
        issuer_id: formData.issuer_id ? Number(formData.issuer_id) : undefined,
        // Card: decide on the spot (approved/rejected). Pix is always async.
        ...(isPix ? {} : { binary_mode: true }),
        payer: {
          email: order.buyerEmail,
          identification: { type: "CPF", number: order.buyerCpf },
        },
      },
      requestOptions: { idempotencyKey: `${orderId}-${randomUUID()}` },
    });

    if (result.status === "approved") {
      await fulfillOrder(orderId, {
        paymentId: String(result.id),
        method: formData.payment_method_id,
        baseUrl,
      });
      return NextResponse.json({ status: "approved", orderId });
    }

    if (isPix && result.status === "pending") {
      await db
        .update(orders)
        .set({ mpPaymentId: String(result.id), paymentMethod: "pix" })
        .where(eq(orders.id, orderId));
      const td = result.point_of_interaction?.transaction_data;
      return NextResponse.json({
        status: "pending",
        method: "pix",
        qr_code: td?.qr_code,
        qr_code_base64: td?.qr_code_base64,
        ticket_url: td?.ticket_url,
      });
    }

    return NextResponse.json({ status: result.status ?? "rejected", detail: result.status_detail });
  } catch (e) {
    const err = e as { message?: string; cause?: unknown };
    console.error("[pay] erro MP:", err.message, JSON.stringify(err.cause ?? ""));
    return NextResponse.json(
      { error: err.message ?? "Erro ao processar o pagamento.", detail: err.cause ?? null },
      { status: 502 },
    );
  }
}
