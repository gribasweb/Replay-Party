import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { coupons } from "@/lib/db/schema";
import { db } from "@/lib/db";
import {
  COUPON_PISTA_PRICE_CENTS,
  COUPON_VIP_PRICE_CENTS,
  isValidCouponCode,
  normalizeCouponCode,
} from "@/lib/coupons";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const rows = await db.select().from(coupons).orderBy(desc(coupons.updatedAt));
  return NextResponse.json({ coupons: rows });
}

export async function POST(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === "string" ? normalizeCouponCode(body.code) : "";
  if (!isValidCouponCode(code)) {
    return NextResponse.json({ error: "Use de 4 a 40 caracteres: letras, nÃºmeros, hÃ­fen ou sublinhado." }, { status: 400 });
  }

  try {
    const [coupon] = await db
      .insert(coupons)
      .values({
        code,
        pistaPriceCents: COUPON_PISTA_PRICE_CENTS,
        vipPriceCents: COUPON_VIP_PRICE_CENTS,
      })
      .returning();
    return NextResponse.json({ ok: true, coupon });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Esse cÃ³digo jÃ¡ existe." }, { status: 409 });
    }
    throw error;
  }
}

export async function PATCH(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => ({}))) as { id?: unknown; active?: unknown };
  if (typeof body.id !== "string" || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Dados do cupom invÃ¡lidos." }, { status: 400 });
  }

  const [coupon] = await db
    .update(coupons)
    .set({ active: body.active, updatedAt: new Date() })
    .where(eq(coupons.id, body.id))
    .returning();

  if (!coupon) return NextResponse.json({ error: "Cupom nÃ£o encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, coupon });
}
