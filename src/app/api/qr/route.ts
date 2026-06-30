import QRCode from "qrcode";
import { and, eq } from "drizzle-orm";
import { baseUrlFromRequest } from "@/lib/base-url";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";

export const runtime = "nodejs";

/** Serve o QR Code de um ingresso como PNG (usado nos e-mails). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response("token ausente", { status: 400 });

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .innerJoin(orders, eq(tickets.orderId, orders.id))
    .where(and(eq(tickets.qrToken, token), eq(orders.status, "paid")))
    .limit(1);
  if (!ticket) return new Response("ingresso nao confirmado", { status: 404 });

  const baseUrl = baseUrlFromRequest(req);
  const png = await QRCode.toBuffer(`${baseUrl}/ingresso/${token}`, {
    margin: 1,
    width: 300,
    color: { dark: "#040406", light: "#ffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
