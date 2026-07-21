import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);

/** CPF mascarado para exibição (LGPD): mostra apenas os dígitos centrais. */
function maskCpf(cpf: string): string {
  const d = String(cpf).replace(/\D/g, "");
  if (d.length !== 11) return "***";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/**
 * Lista de compradores (pedidos pagos) + resumo, para o painel do organizador.
 * Protegido pela sessão de operador. CPF sempre mascarado.
 */
export async function GET(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const summary = (await db.execute(sql`
    select count(distinct o.id)::int as orders,
           count(t.id)::int as tickets,
           coalesce(sum(t.price_cents), 0)::int as revenue,
           count(*) filter (where t.status = 'used')::int as checked_in
    from orders o
    join tickets t on t.order_id = o.id
    where o.status = 'paid'
  `)) as unknown as Row[];

  const byTier = (await db.execute(sql`
    select t.tier_name as tier, count(*)::int as qty,
           coalesce(sum(t.price_cents), 0)::int as revenue
    from orders o
    join tickets t on t.order_id = o.id
    where o.status = 'paid'
    group by t.tier_name
    order by t.tier_name
  `)) as unknown as Row[];

  const orders = (await db.execute(sql`
    select o.id, o.buyer_name, o.buyer_email, o.buyer_whatsapp, o.buyer_cpf,
           o.total_cents, o.payment_method, o.coupon_code, o.created_at
    from orders o
    where o.status = 'paid'
    order by o.created_at desc
    limit 1000
  `)) as unknown as Row[];

  const parts = (await db.execute(sql`
    select t.order_id, t.holder_name, t.holder_cpf, t.tier_name, t.status
    from orders o
    join tickets t on t.order_id = o.id
    where o.status = 'paid'
    order by t.id
  `)) as unknown as Row[];

  const byOrder = new Map<string, { name: string; cpf: string; tier: string; used: boolean }[]>();
  for (const p of parts) {
    const oid = String(p.order_id);
    const list = byOrder.get(oid) ?? [];
    list.push({
      name: String(p.holder_name),
      cpf: maskCpf(String(p.holder_cpf)),
      tier: String(p.tier_name),
      used: p.status === "used",
    });
    byOrder.set(oid, list);
  }

  return NextResponse.json({
    summary: {
      orders: num(summary[0]?.orders),
      tickets: num(summary[0]?.tickets),
      revenueCents: num(summary[0]?.revenue),
      checkedIn: num(summary[0]?.checked_in),
    },
    byTier: byTier.map((r) => ({ tier: String(r.tier), qty: num(r.qty), revenueCents: num(r.revenue) })),
    orders: orders.map((o) => ({
      id: String(o.id),
      name: String(o.buyer_name),
      email: String(o.buyer_email),
      whatsapp: String(o.buyer_whatsapp ?? ""),
      cpfMasked: maskCpf(String(o.buyer_cpf)),
      totalCents: num(o.total_cents),
      method: String(o.payment_method ?? ""),
      couponCode: String(o.coupon_code ?? ""),
      createdAt: o.created_at,
      participants: byOrder.get(String(o.id)) ?? [],
    })),
  });
}
