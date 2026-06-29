import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { mpPayment } from "@/lib/mercadopago";
import { fulfillOrder } from "@/lib/fulfill";

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
      const payment = await mpPayment.get({ id: order.mpPaymentId });
      if (payment.status === "approved") {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
        await fulfillOrder(orderId, {
          paymentId: order.mpPaymentId,
          method: order.paymentMethod ?? "pix",
          baseUrl,
        });
        return NextResponse.json({ status: "paid" });
      }
      return NextResponse.json({ status: payment.status ?? "pending" });
    } catch {
      return NextResponse.json({ status: order.status });
    }
  }

  return NextResponse.json({ status: order.status });
}
