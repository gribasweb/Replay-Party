"use client";

import { ArrowRight, InstagramLogo, MapPin, Ticket, WhatsappLogo } from "@phosphor-icons/react";
import { EVENT } from "@/lib/event";
import { Reveal } from "@/components/reveal";

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.venue.mapsQuery)}`;

const NAV = [
  { label: "Início", href: "#inicio" },
  { label: "Ingressos", href: "#ingressos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Regras", href: "#regras" },
  { label: "Meus ingressos", href: "/meus-ingressos" },
];

export function SiteFooter() {
  return (
    <footer id="contato" className="scroll-mt-20 border-t border-grape/50 bg-ink">
      {/* Final CTA */}
      <div className="relative overflow-hidden border-b border-grape/50">
        <div aria-hidden className="animate-drift absolute -left-20 top-0 h-72 w-72 rounded-full bg-violet opacity-30 blur-[120px]" />
        <div aria-hidden className="animate-drift absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-magenta opacity-30 blur-[120px]" style={{ animationDelay: "2s" }} />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 text-center lg:px-8 lg:py-28">
          <Reveal>
            <h2 className="font-display text-6xl leading-[0.85] text-chalk uppercase sm:text-7xl lg:text-8xl">
              Bora pra <span className="text-magenta text-glow-magenta">Replay</span>?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-ash">
              Garanta seu ingresso antes do próximo lote. A pista te espera no dia {EVENT.dayLabel}.
            </p>
            <a
              href="#ingressos"
              className="glow-magenta group mt-8 inline-flex items-center gap-2 bg-magenta px-8 py-4 text-sm font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              Comprar ingresso
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Reveal>
        </div>
      </div>

      {/* Info grid */}
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center bg-magenta text-ink" style={{ borderRadius: "var(--radius-stamp)" }}>
              <Ticket weight="fill" className="h-5 w-5" />
            </span>
            <span className="font-display text-xl tracking-wide text-chalk">
              REPLAY<span className="text-magenta">PARTY</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-ash">
            {EVENT.dateLabel} · {EVENT.timeLabel}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-start gap-2 text-sm text-ash transition-colors hover:text-chalk"
          >
            <MapPin weight="bold" className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
            <span>
              {EVENT.venue.street}, {EVENT.venue.district}
              <br />
              {EVENT.venue.city} · {EVENT.venue.cep}
            </span>
          </a>
        </div>

        <div>
          <h3 className="font-mono text-[11px] tracking-widest text-ash uppercase">Suporte</h3>
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={EVENT.social.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-chalk transition-colors hover:text-magenta"
            >
              <WhatsappLogo weight="fill" className="h-5 w-5" />
              {EVENT.social.whatsappLabel}
            </a>
            <a
              href={EVENT.social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-chalk transition-colors hover:text-magenta"
            >
              <InstagramLogo weight="fill" className="h-5 w-5" />
              {EVENT.social.instagram}
            </a>
          </div>
        </div>

        <nav>
          <h3 className="font-mono text-[11px] tracking-widest text-ash uppercase">Navegação</h3>
          <div className="mt-4 flex flex-col gap-3">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-chalk transition-colors hover:text-magenta">
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      <div className="border-t border-grape/50">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-5 py-6 text-center sm:flex-row sm:text-left lg:px-8">
          <p className="font-mono text-[11px] tracking-wider text-ash">
            © 2026 {EVENT.name}. Todos os direitos reservados.
          </p>
          <p className="font-mono text-[11px] tracking-wider text-ash">
            Pagamentos via Pix e cartão
          </p>
        </div>
      </div>
    </footer>
  );
}
