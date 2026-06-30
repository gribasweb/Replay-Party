import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { mpPayment, mpPaymentWith } from "@/lib/mercadopago";
import { getValidVendorToken } from "@/lib/mp-vendor";
import { fulfillOrder } from "@/lib/fulfill";
import { baseUrlFromRequest } from "@/lib/base-url";

export const runtime = "nodejs";

// Polled by the frontend while waiting for a Pix payment to clear.
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId ausente" }, { status: 400 });

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ status: "paid" });

  if (order.mpPaymentId) {
    try {
      // O pagamento foi criado na conta do vendedor (split), então a consulta
      // tem que usar o token DELE. Sem vendedor conectado, cai no token próprio.
      const vendor = await getValidVendorToken();
      const client = vendor ? mpPaymentWith(vendor.accessToken) : mpPayment;
      const payment = await client.get({ id: order.mpPaymentId });
      if (payment.status === "approved") {
        const baseUrl = baseUrlFromRequest(req);
        const fulfilled = await fulfillOrder(orderId, {
          paymentId: order.mpPaymentId,
          method: order.paymentMethod ?? "pix",
          baseUrl,
        });
        return NextResponse.json({ status: fulfilled ? "paid" : order.expiresAt < new Date() ? "expired" : order.status });
      }
      return NextResponse.json({ status: payment.status ?? "pending" });
    } catch (e) {
      console.error("[payment-status] erro ao consultar MP:", e);
      return NextResponse.json({ status: order.status });
    }
  }

  return NextResponse.json({ status: order.status });
}
