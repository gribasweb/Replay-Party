import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Classifica a origem do acesso a partir do referrer (sem PII). */
function sourceFrom(referrer: string, ownHost: string): string {
  if (!referrer) return "direto";
  let h: string;
  try {
    h = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "outro";
  }
  if (ownHost && h.includes(ownHost)) return "interno";
  if (h.includes("instagram") || h === "ig.me") return "instagram";
  if (h.includes("whatsapp") || h === "wa.me") return "whatsapp";
  if (h.includes("facebook") || h.includes("fb.")) return "facebook";
  if (h.includes("tiktok")) return "tiktok";
  if (h.includes("google")) return "google";
  if (h.includes("bing")) return "bing";
  if (h.includes("linktr")) return "linktree";
  if (h === "t.co" || h.includes("twitter") || h === "x.com") return "twitter";
  if (h.includes("youtube") || h === "youtu.be") return "youtube";
  return h;
}

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "track"), { limit: 60, windowMs: 60 * 1000 });
  if (!limited.ok) return NextResponse.json({ ok: false }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { path?: string; referrer?: string };
  const path = (body.path ?? "/").slice(0, 200);
  const referrer = (body.referrer ?? "").slice(0, 400);

  // Visitante anônimo: hash de ip+user-agent+dia. Não guardamos IP cru nem cookie.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const ua = req.headers.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 16);

  const ownHost = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .toLowerCase()
    .replace(/^www\./, "")
    .split(":")[0];
  const source = sourceFrom(referrer, ownHost);

  try {
    await db.insert(pageViews).values({ path, referrer: referrer || null, source, visitor });
  } catch {
    /* tracking nunca pode quebrar a navegação */
  }
  return NextResponse.json({ ok: true });
}
