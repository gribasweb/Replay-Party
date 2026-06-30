import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { mpPayment, mpPaymentWith } from "@/lib/mercadopago";
import { getValidVendorToken } from "@/lib/mp-vendor";
import { fulfillOrder } from "@/lib/fulfill";
import { baseUrlFromRequest } from "@/lib/base-url";

export const runtime = "nodejs";

/**
 * Webhook do Mercado Pago. Notifica quando um pagamento muda de status —
 * essencial para o Pix, que confirma de forma assíncrona (mesmo se o comprador
 * fechar a página). Re-consultamos o pagamento no MP (com o token do vendedor,
 * pois o pagamento vive na conta dele) e, se aprovado, emitimos o ingresso.
 * Idempotente: `fulfillOrder` só envia o e-mail na transição pending -> paid.
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = (await req.json().catch(() => null)) as
      | { type?: string; action?: string; data?: { id?: string | number } }
      | null;

    const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body?.type;
    // Só nos interessa notificação de pagamento.
    if (type && type !== "payment") return NextResponse.json({ ok: true });

    const paymentId =
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      (body?.data?.id != null ? String(body.data.id) : null);
    if (!paymentId) return NextResponse.json({ ok: true });

    const vendor = await getValidVendorToken();
    const client = vendor ? mpPaymentWith(vendor.accessToken) : mpPayment;
    const payment = await client.get({ id: paymentId });

    if (payment.status === "approved" && payment.external_reference) {
      const orderId = payment.external_reference;
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (order) {
        await fulfillOrder(orderId, {
          paymentId: String(paymentId),
          method: order.paymentMethod ?? payment.payment_method_id ?? "pix",
          baseUrl: baseUrlFromRequest(req),
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[mp/webhook] erro:", e);
    // 500 faz o Mercado Pago reenviar a notificação depois (retry).
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
