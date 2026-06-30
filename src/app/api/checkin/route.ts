import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { onlyDigits } from "@/lib/cpf";

export const runtime = "nodejs";

interface CheckinBody {
  password?: string;
  action?: "scan" | "redeem" | "search" | "stats" | "recent";
  token?: string;
  ticketId?: string;
  query?: string;
}

function passwordOk(pw: unknown) {
  const expected = process.env.CHECKIN_PASSWORD ?? "";
  return expected.length > 0 && pw === expected;
}

/** Accepts the raw QR text, which is a /ingresso/<token> URL, or a bare token. */
function extractToken(text: string) {
  const match = text.match(/\/ingresso\/([^/?#\s]+)/);
  return (match ? match[1] : text).trim();
}

export async function POST(req: Request) {
  let body: CheckinBody;
  try {
    body = (await req.json()) as CheckinBody;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!passwordOk(body.password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  // Live counter of entries.
  if (body.action === "stats") {
    const [row] = await db
      .select({
        total: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
        used: sql<number>`count(*) filter (where ${orders.status} = 'paid' and ${tickets.status} = 'used')::int`,
      })
      .from(tickets)
      .innerJoin(orders, eq(tickets.orderId, orders.id));
    return NextResponse.json({ total: Number(row?.total ?? 0), used: Number(row?.used ?? 0) });
  }

  // Últimas entradas: lista ao vivo dos validados, mais recentes primeiro.
  if (body.action === "recent") {
    const rows = await db
      .select({
        id: tickets.id,
        name: tickets.holderName,
        tierName: tickets.tierName,
        checkedInAt: tickets.checkedInAt,
      })
      .from(tickets)
      .innerJoin(orders, eq(tickets.orderId, orders.id))
      .where(and(eq(orders.status, "paid"), eq(tickets.status, "used")))
      .orderBy(desc(tickets.checkedInAt))
      .limit(30);
    return NextResponse.json({ recent: rows });
  }

  // Plan B: search by name or CPF.
  if (body.action === "search") {
    const q = (body.query ?? "").trim();
    if (q.length < 2) return NextResponse.json({ results: [] });
    const digits = onlyDigits(q);
    const rows = await db
      .select({
        id: tickets.id,
        name: tickets.holderName,
        cpf: tickets.holderCpf,
        tierName: tickets.tierName,
        status: tickets.status,
        checkedInAt: tickets.checkedInAt,
      })
      .from(tickets)
      .innerJoin(orders, eq(tickets.orderId, orders.id))
      .where(
        and(
          eq(orders.status, "paid"),
          or(
            ilike(tickets.holderName, `%${q}%`),
            digits.length >= 3 ? ilike(tickets.holderCpf, `%${digits}%`) : sql`false`,
          ),
        ),
      )
      .limit(15);
    return NextResponse.json({ results: rows });
  }

  // Redeem (give the entry): by QR token or by ticket id.
  let where;
  if (body.action === "scan") {
    const token = extractToken(body.token ?? "");
    if (!token) return NextResponse.json({ result: "invalid", message: "QR vazio." });
    where = eq(tickets.qrToken, token);
  } else if (body.action === "redeem") {
    if (!body.ticketId) return NextResponse.json({ result: "invalid", message: "Ingresso não informado." });
    where = eq(tickets.id, body.ticketId);
  } else {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  try {
    const outcome = await db.transaction(async (tx) => {
      const [t] = await tx.select().from(tickets).where(where).for("update");
      if (!t) return { result: "invalid" as const, message: "Ingresso não encontrado." };

      const [o] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, t.orderId));
      if (!o || o.status !== "paid") {
        return { result: "invalid" as const, message: "Ingresso não confirmado." };
      }
      if (t.status === "cancelled") return { result: "invalid" as const, message: "Ingresso cancelado." };
      if (t.status === "used") {
        return { result: "used" as const, name: t.holderName, tierName: t.tierName, checkedInAt: t.checkedInAt };
      }

      await tx.update(tickets).set({ status: "used", checkedInAt: new Date() }).where(eq(tickets.id, t.id));
      return { result: "ok" as const, name: t.holderName, tierName: t.tierName, cpf: t.holderCpf };
    });
    return NextResponse.json(outcome);
  } catch {
    return NextResponse.json({ result: "invalid", message: "Erro ao validar." }, { status: 500 });
  }
}
