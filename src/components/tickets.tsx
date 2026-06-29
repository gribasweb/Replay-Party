"use client";

import { Check, Crown, Info, MusicNotes, Ticket, type Icon } from "@phosphor-icons/react";
import { brl, TICKETS, type TicketTier } from "@/lib/event";
import { Reveal } from "@/components/reveal";

const ACCENT = {
  violet: {
    icon: MusicNotes as Icon,
    border: "border-violet/35",
    hover: "hover:border-violet hover:glow-violet",
    text: "text-violet",
    softBg: "bg-violet/10",
    ring: "ring-violet/40",
    btn: "bg-violet text-chalk hover:bg-violet/90",
    check: "text-violet",
  },
  magenta: {
    icon: Crown as Icon,
    border: "border-magenta/35",
    hover: "hover:border-magenta hover:glow-magenta",
    text: "text-magenta",
    softBg: "bg-magenta/10",
    ring: "ring-magenta/40",
    btn: "bg-magenta text-ink hover:bg-magenta/90",
    check: "text-magenta",
  },
} as const;

function TicketCard({ tier, index }: { tier: TicketTier; index: number }) {
  const a = ACCENT[tier.accent];
  const TierIcon = a.icon;

  return (
    <Reveal delay={index * 0.12}>
      <article
        className={`relative flex h-full flex-col border bg-plum transition-all duration-300 ${a.border} ${a.hover}`}
        style={{ borderRadius: "var(--radius-stamp)" }}
      >
        {/* Upper body: tier identity + perks */}
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 place-items-center ${a.softBg} ${a.text}`} style={{ borderRadius: "var(--radius-stamp)" }}>
                <TierIcon weight="fill" className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-3xl leading-none text-chalk uppercase">{tier.name}</h3>
                <p className="mt-1 font-mono text-[11px] tracking-widest text-ash uppercase">{tier.tagline}</p>
              </div>
            </div>
          </div>

          <ul className="mt-6 grid gap-2.5">
            {tier.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm text-chalk/90">
                <Check weight="bold" className={`h-4 w-4 shrink-0 ${a.check}`} />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Perforation line with side notches */}
        <div className="relative h-6">
          <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-ink" />
          <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-ink" />
          <span className="absolute inset-x-5 top-1/2 border-t border-dashed border-grape" />
        </div>

        {/* Lots */}
        <div className="flex flex-1 flex-col gap-2 p-6 pt-2 lg:p-8 lg:pt-2">
          {tier.lots.map((lot) => {
            const isActive = lot.status === "active";
            return (
              <div
                key={lot.n}
                className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                  isActive ? `${a.softBg} ring-1 ${a.ring}` : "opacity-55"
                }`}
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                <div>
                  <div className="font-mono text-[11px] tracking-wider text-ash uppercase">
                    {lot.label} · {lot.window}
                  </div>
                  <div className="font-display text-3xl leading-tight text-chalk">{brl(lot.price)}</div>
                </div>

                {isActive ? (
                  <a
                    href={`/checkout?lot=${tier.id}-${lot.n}`}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-wide uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0 ${a.btn}`}
                    style={{ borderRadius: "var(--radius-stamp)" }}
                  >
                    <Ticket weight="fill" className="h-4 w-4" />
                    Garantir
                  </a>
                ) : (
                  <span className="font-mono text-[11px] tracking-widest text-ash uppercase">
                    Em breve
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Stub footer */}
        <div className="flex items-center justify-between gap-4 border-t border-grape/50 px-6 py-4 lg:px-8">
          <div className="h-7 flex-1 barcode opacity-70" aria-hidden />
          <span className="font-mono text-[10px] tracking-[0.3em] text-ash uppercase">Admit One</span>
        </div>
      </article>
    </Reveal>
  );
}

export function Tickets() {
  return (
    <section id="ingressos" className="relative scroll-mt-20 bg-ink py-20 lg:py-28">
      <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-5xl leading-none text-chalk uppercase sm:text-6xl">
                Ingressos
              </h2>
              <p className="mt-3 max-w-md text-ash">
                Quanto antes você garante, menos você paga. Os lotes viram por data.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start border border-grape bg-plum px-4 py-2 sm:self-auto" style={{ borderRadius: "var(--radius-stamp)" }}>
              <Info weight="bold" className="h-4 w-4 text-violet" />
              <span className="font-mono text-[11px] tracking-wider text-ash uppercase">
                {TICKETS[0].perLotStock} ingressos por lote
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {TICKETS.map((tier, i) => (
            <TicketCard key={tier.id} tier={tier} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
