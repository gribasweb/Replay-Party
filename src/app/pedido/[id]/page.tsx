import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { CalendarBlank, CheckCircle, MapPin, XCircle } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { orders, tickets } from "@/lib/db/schema";
import { EVENT } from "@/lib/event";
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

const formatCheckin = (d: Date) =>
  d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let order = null;
  let ticketRows: (typeof tickets.$inferSelect)[] = [];
  try {
    [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (order?.status === "paid") {
      ticketRows = await db.select().from(tickets).where(eq(tickets.orderId, id));
    }
  } catch {
    order = null;
  }

  if (!order) {
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

  if (order.status !== "paid") {
    const expired = order.expiresAt < new Date();
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-4xl text-chalk uppercase">
            {expired ? "Reserva expirada" : "Pagamento pendente"}
          </h1>
          <p className="mt-3 text-sm text-ash">
            {expired
              ? "Esse pedido nao foi confirmado dentro do prazo. Faca uma nova compra para emitir os ingressos."
              : "Os ingressos aparecem aqui assim que o pagamento for confirmado."}
          </p>
          <Link href="/#ingressos" className="mt-6 inline-block bg-magenta px-6 py-3 text-sm font-bold tracking-wide text-ink uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
            Ver ingressos
          </Link>
        </div>
      </main>
    );
  }

  if (ticketRows.length === 0) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 text-center">
        <div>
          <h1 className="font-display text-4xl text-chalk uppercase">Pedido nao encontrado</h1>
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
              {EVENT.venue.street}, {EVENT.venue.district} · {EVENT.venue.city} · {EVENT.venue.cep}
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
              <article
                className={`overflow-hidden border bg-plum ${t.status === "used" ? "border-magenta/60" : "border-grape"}`}
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
              <div className="flex items-center justify-between bg-gradient-to-r from-grape/60 to-plum px-5 py-3">
                <span className="font-display text-2xl text-chalk uppercase">{t.tierName}</span>
                {t.status === "used" ? (
                  <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-magenta uppercase">
                    <XCircle weight="fill" className="h-4 w-4" /> Utilizado
                  </span>
                ) : (
                  <span className="font-mono text-[11px] tracking-widest text-ash uppercase">
                    Ingresso {i + 1} de {ticketsWithQr.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-5 p-5 sm:flex-row">
                <div className="shrink-0 bg-white p-3" style={{ borderRadius: "var(--radius-stamp)" }}>
                  <Image
                    src={t.qr}
                    alt="QR Code do ingresso"
                    width={150}
                    height={150}
                    unoptimized
                    className={t.status === "used" || t.status === "cancelled" ? "opacity-25" : ""}
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-mono text-[11px] tracking-widest text-ash uppercase">Participante</div>
                  <div className="font-display text-2xl leading-tight text-chalk">{t.holderName}</div>
                  <div className="mt-1 font-mono text-sm text-ash">CPF {maskCpf(t.holderCpf)}</div>
                  {t.status === "used" ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 border border-magenta/40 bg-magenta/10 px-3 py-1 font-mono text-[10px] tracking-widest text-magenta uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                      <XCircle weight="fill" className="h-3.5 w-3.5" />
                      Já utilizado{t.checkedInAt ? ` · ${formatCheckin(t.checkedInAt)}` : ""}
                    </div>
                  ) : t.status === "cancelled" ? (
                    <div className="mt-3 inline-block border border-ash/40 bg-ash/10 px-3 py-1 font-mono text-[10px] tracking-widest text-ash uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                      Cancelado
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-1.5 border border-violet/40 bg-violet/10 px-3 py-1 font-mono text-[10px] tracking-widest text-violet uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                      <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                      Válido · {EVENT.dateLabel}
                    </div>
                  )}
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
