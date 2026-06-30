import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

const TZ = "America/Sao_Paulo";
type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);

/** Agregados do contador de acessos. Protegido pela sessão de operador. */
export async function GET(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const totals = (await db.execute(sql`
    select count(*)::int as views, count(distinct visitor)::int as visitors from page_views
  `)) as unknown as Row[];

  const today = (await db.execute(sql`
    select count(*)::int as views, count(distinct visitor)::int as visitors
    from page_views
    where (created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date
  `)) as unknown as Row[];

  const byDay = (await db.execute(sql`
    select to_char((created_at at time zone ${TZ})::date, 'DD/MM') as day,
           count(*)::int as views, count(distinct visitor)::int as visitors
    from page_views
    where created_at >= now() - interval '14 days'
    group by (created_at at time zone ${TZ})::date
    order by (created_at at time zone ${TZ})::date
  `)) as unknown as Row[];

  const sources = (await db.execute(sql`
    select coalesce(source, 'outro') as source,
           count(distinct visitor)::int as visitors, count(*)::int as views
    from page_views
    group by source
    order by visitors desc, views desc
    limit 12
  `)) as unknown as Row[];

  return NextResponse.json({
    totalViews: n(totals[0]?.views),
    totalVisitors: n(totals[0]?.visitors),
    todayViews: n(today[0]?.views),
    todayVisitors: n(today[0]?.visitors),
    byDay: byDay.map((r) => ({ day: String(r.day), views: n(r.views), visitors: n(r.visitors) })),
    sources: sources.map((r) => ({ source: String(r.source), visitors: n(r.visitors), views: n(r.views) })),
  });
}
