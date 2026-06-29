import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { sendTicketEmail } from "@/lib/email";

/**
 * Marks an order as paid atomically (only on the real pending -> paid
 * transition) and sends the ticket e-mail exactly once. Safe to call from both
 * the payment route and the status-polling route.
 */
export async function fulfillOrder(
  orderId: string,
  opts: { paymentId?: string; method?: string; baseUrl: string },
): Promise<void> {
  const updated = await db
    .update(orders)
    .set({ status: "paid", mpPaymentId: opts.paymentId, paymentMethod: opts.method })
    .where(and(eq(orders.id, orderId), ne(orders.status, "paid")))
    .returning({ email: orders.buyerEmail, name: orders.buyerName });

  // Empty => was already paid (or doesn't exist): don't resend the e-mail.
  if (updated.length === 0) return;

  const order = updated[0];
  const ticketRows = await db
    .select({ holderName: tickets.holderName, tierName: tickets.tierName })
    .from(tickets)
    .where(eq(tickets.orderId, orderId));

  try {
    await sendTicketEmail({
      to: order.email,
      buyerName: order.name,
      orderId,
      tickets: ticketRows,
      baseUrl: opts.baseUrl,
    });
  } catch {
    /* e-mail failure must not break fulfillment */
  }
}
