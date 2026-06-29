"use client";

import { QRCodeSVG } from "qrcode.react";
import { ArrowsLeftRight, ShieldCheck, Wallet } from "@phosphor-icons/react";
import { EVENT } from "@/lib/event";
import { Reveal } from "@/components/reveal";

export function WhyOnline() {
  return (
    <section className="border-t border-grape/50 bg-ink py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-5xl leading-none text-chalk uppercase sm:text-6xl">
            Por que comprar online
          </h2>
          <p className="mt-3 max-w-md text-ash">Mais seguro, mais rápido e sem filas na hora da festa.</p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-12">
          {/* Secure payment - feature cell */}
          <Reveal className="md:col-span-7">
            <div
              className="relative flex h-full flex-col justify-between overflow-hidden border border-grape bg-gradient-to-br from-grape/50 via-plum to-plum p-7 lg:p-9"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              <ShieldCheck weight="duotone" className="h-12 w-12 text-violet" />
              <div className="mt-10">
                <h3 className="font-display text-3xl leading-none text-chalk uppercase">
                  Compra 100% segura
                </h3>
                <p className="mt-3 max-w-md text-ash">
                  Pagamento processado pelo Mercado Pago, com Pix e cartão de crédito. Seus dados protegidos do começo ao fim.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 border border-violet/40 bg-violet/10 px-3 py-1.5 font-mono text-[11px] tracking-wider text-violet uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                  Powered by Mercado Pago
                </span>
              </div>
            </div>
          </Reveal>

          {/* QR - visual cell */}
          <Reveal className="md:col-span-5">
            <div
              className="flex h-full flex-col items-start justify-between gap-6 border border-grape bg-plum p-7 lg:p-9"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              <div className="bg-chalk p-3" style={{ borderRadius: "var(--radius-stamp)" }}>
                <QRCodeSVG value={EVENT.social.instagramUrl} size={92} bgColor="#efebef" fgColor="#040406" level="M" />
              </div>
              <div>
                <h3 className="font-display text-2xl leading-none text-chalk uppercase">
                  Entrada rápida
                </h3>
                <p className="mt-2 text-sm text-ash">
                  Cada ingresso tem um QR Code único, lido em segundos na portaria.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Transferable */}
          <Reveal className="md:col-span-5">
            <div
              className="flex h-full flex-col justify-between gap-6 border border-grape bg-plum p-7 lg:p-9"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              <ArrowsLeftRight weight="duotone" className="h-11 w-11 text-magenta" />
              <div>
                <h3 className="font-display text-2xl leading-none text-chalk uppercase">
                  Ingresso transferível
                </h3>
                <p className="mt-2 text-sm text-ash">
                  Não vai mais? Passe seu ingresso para outra pessoa sem dor de cabeça.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Door sales */}
          <Reveal className="md:col-span-7">
            <div
              className="relative flex h-full flex-col justify-between overflow-hidden border border-grape bg-gradient-to-bl from-magenta/25 via-plum to-plum p-7 lg:p-9"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              <Wallet weight="duotone" className="h-12 w-12 text-magenta" />
              <div className="mt-10">
                <h3 className="font-display text-3xl leading-none text-chalk uppercase">
                  Também na portaria
                </h3>
                <p className="mt-3 max-w-md text-ash">
                  Quem chegar sem ingresso compra no local pelo valor do 3º lote, tanto na Pista quanto no VIP. No site você paga menos.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
