"use client";

import { CreditCard, HandPointing, IdentificationCard, QrCode, type Icon } from "@phosphor-icons/react";
import { Reveal } from "@/components/reveal";

const STEPS: { icon: Icon; title: string; desc: string }[] = [
  { icon: HandPointing, title: "Escolha seu setor", desc: "Pista ou VIP, no lote disponível." },
  { icon: IdentificationCard, title: "Preencha seus dados", desc: "Nome, CPF e WhatsApp. Rápido." },
  { icon: CreditCard, title: "Pague com Pix ou cartão", desc: "Aprovação na hora, com segurança." },
  { icon: QrCode, title: "Receba o QR Code", desc: "Direto no seu e-mail. Pronto." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-t border-grape/50 bg-coal py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-5xl leading-none text-chalk uppercase sm:text-6xl">
            Como funciona
          </h2>
          <p className="mt-3 max-w-md text-ash">Do clique ao QR Code na mão, em quatro passos.</p>
        </Reveal>

        <div className="relative mt-14 grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
          {/* Connector line on desktop */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-violet/10 via-violet/40 to-magenta/10 lg:block"
          />
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 0.1} className="relative">
              <div className="flex items-center gap-4 lg:block">
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center border border-grape bg-ink text-violet" style={{ borderRadius: "var(--radius-stamp)" }}>
                  <Icon weight="bold" className="h-7 w-7" />
                </span>
                <span className="font-display text-5xl leading-none text-grape lg:hidden">
                  0{i + 1}
                </span>
              </div>
              <div className="mt-0 pl-[4.5rem] lg:mt-6 lg:pl-0">
                <div className="hidden font-mono text-xs tracking-widest text-violet lg:block">
                  0{i + 1}
                </div>
                <h3 className="mt-0 text-lg font-bold text-chalk lg:mt-2">{title}</h3>
                <p className="mt-1 max-w-[18rem] text-sm text-ash">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
