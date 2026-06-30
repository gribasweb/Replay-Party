import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { EVENT, brl } from "@/lib/event";
import { onlyDigits } from "@/lib/cpf";
import { baseUrlFromHeaders } from "@/lib/base-url";
import { SuccessCelebration } from "@/components/success-celebration";
import { TicketReveal } from "@/components/ticket-reveal";

export const dynamic = "force-dynamic";

const maskCpf = (cpf: string) => {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
};

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let order = null;
  let ticketRows: (typeof tickets.$inferSelect)[] = [];
  try {
    [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (order) {
      ticketRows = await db.select().from(tickets).where(eq(tickets.orderId, id));
    }
  } catch {
    order = null;
  }

  if (!order || ticketRows.length === 0) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 text-center">
        <div>
          <h1 className="font-display text-4xl text-chalk uppercase">Pedido não encontrado</h1>
          <Link href="/#ingressos" className="mt-6 inline-block bg-magenta px-6 py-3 text-sm font-bold tracking-wide text-ink uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
            Ver ingressos
          </Link>
        </div>
      </main>
    );
  }

  const baseUrl = await baseUrlFromHeaders();
  const ticketsWithQr = await Promise.all(
    ticketRows.map(async (t) => ({
      ...t,
      qr: await QRCode.toDataURL(`${baseUrl}/ingresso/${t.qrToken}`, {
        margin: 1,
        width: 320,
        color: { dark: "#040406", light: "#ffffff" },
      }),
    })),
  );

  return (
    <main className="min-h-[100dvh] bg-ink py-12">
      <div className="mx-auto max-w-2xl px-5">
        {/* Sucesso (confete + carimbo CONFIRMADO) */}
        <SuccessCelebration count={ticketsWithQr.length} />

        {/* Resumo do evento + endereço */}
        <div className="mt-8 space-y-2 border-y border-grape/50 py-4 text-center font-mono text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <span className="font-display text-lg tracking-wide text-chalk">{EVENT.name}</span>
            <span className="flex items-center gap-2 text-ash">
              <CalendarBlank weight="bold" className="h-4 w-4 text-magenta" />
              {EVENT.dateLabel} · {EVENT.timeLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-ash">
            <MapPin weight="bold" className="h-4 w-4 shrink-0 text-magenta" />
            <span>
              {EVENT.venue.street}, {EVENT.venue.district} · {EVENT.venue.city}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.venue.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-magenta hover:underline"
            >
              Ver no mapa
            </a>
          </div>
        </div>

        {/* Ingressos */}
        <div className="mt-8 space-y-6">
          {ticketsWithQr.map((t, i) => (
            <TicketReveal key={t.id} index={i}>
              <article className="overflow-hidden border border-grape bg-plum" style={{ borderRadius: "var(--radius-stamp)" }}>
              <div className="flex items-center justify-between bg-gradient-to-r from-grape/60 to-plum px-5 py-3">
                <span className="font-display text-2xl text-chalk uppercase">{t.tierName}</span>
                <span className="font-mono text-[11px] tracking-widest text-ash uppercase">
                  Ingresso {i + 1} de {ticketsWithQr.length}
                </span>
              </div>
              <div className="flex flex-col items-center gap-5 p-5 sm:flex-row">
                <div className="shrink-0 bg-white p-3" style={{ borderRadius: "var(--radius-stamp)" }}>
                  <Image src={t.qr} alt="QR Code do ingresso" width={150} height={150} unoptimized />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-mono text-[11px] tracking-widest text-ash uppercase">Participante</div>
                  <div className="font-display text-2xl leading-tight text-chalk">{t.holderName}</div>
                  <div className="mt-1 font-mono text-sm text-ash">CPF {maskCpf(t.holderCpf)}</div>
                  <div className="mt-3 inline-block border border-violet/40 bg-violet/10 px-3 py-1 font-mono text-[10px] tracking-widest text-violet uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                    Válido · {EVENT.dateLabel}
                  </div>
                </div>
              </div>
              <div className="barcode h-7 opacity-70" aria-hidden />
              </article>
            </TicketReveal>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link href="/meus-ingressos" className="text-sm text-magenta hover:underline">
            Consultar meus ingressos depois
          </Link>
          <Link href="/" className="text-sm text-ash hover:text-chalk">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
