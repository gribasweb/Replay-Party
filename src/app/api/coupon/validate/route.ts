import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { coupons } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { isValidCouponCode, normalizeCouponCode } from "@/lib/coupons";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "coupon-validate"), { limit: 12, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === "string" ? normalizeCouponCode(body.code) : "";
  if (!isValidCouponCode(code)) return NextResponse.json({ error: "Cupom invÃ¡lido." }, { status: 400 });

  const [coupon] = await db.select().from(coupons).where(and(eq(coupons.code, code), eq(coupons.active, true)));
  if (!coupon) return NextResponse.json({ error: "Cupom invÃ¡lido ou inativo." }, { status: 404 });

  return NextResponse.json({
    code: coupon.code,
    pistaPriceCents: coupon.pistaPriceCents,
    vipPriceCents: coupon.vipPriceCents,
  });
}
