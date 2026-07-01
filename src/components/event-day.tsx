"use client";

import {
  BeerStein,
  Car,
  IdentificationCard,
  Prohibit,
  ShieldWarning,
  type Icon,
} from "@phosphor-icons/react";
import { Reveal } from "@/components/reveal";

/** Coisas que a pessoa precisa levar / saber antes de chegar. */
const BRING: { icon: Icon; title: string; note: string }[] = [
  { icon: IdentificationCard, title: "Documento com foto", note: "Obrigatório na entrada." },
  { icon: BeerStein, title: "Seu copo", note: "Leve o seu para as bebidas." },
  { icon: Car, title: "Estacionamento no local", note: "R$ 15." },
];

/** O que não é permitido (regulamento). */
const NOT_ALLOWED: string[] = [
  "Bebidas ou coolers de fora",
  "Copos ou garrafas de vidro",
  "Armas ou objetos cortantes",
  "Brigas, assédio ou desrespeito",
  "Subir em estruturas ou áreas restritas",
  "Área VIP sem pulseira",
  "Som automotivo ou caixas de som",
  "Danificar móveis ou equipamentos",
];

export function EventDay() {
  return (
    <section id="regulamento" className="scroll-mt-20 border-t border-grape/50 bg-coal py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-5xl leading-none text-chalk uppercase sm:text-6xl">
            No dia do evento
          </h2>
          <p className="mt-3 max-w-md text-ash">
            O básico pra entrar tranquilo e curtir do início ao fim.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-5 lg:gap-14">
          {/* Leve com você */}
          <Reveal className="lg:col-span-2">
            <h3 className="font-mono text-[11px] tracking-widest text-violet uppercase">
              Leve com você
            </h3>
            <ul className="mt-5 grid gap-4">
              {BRING.map(({ icon: Icon, title, note }) => (
                <li key={title} className="flex items-center gap-4">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center border border-grape bg-plum text-violet"
                    style={{ borderRadius: "var(--radius-stamp)" }}
                  >
                    <Icon weight="bold" className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-base font-bold text-chalk">{title}</div>
                    <div className="text-sm text-ash">{note}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Não é permitido */}
          <Reveal delay={0.1} className="lg:col-span-3">
            <h3 className="font-mono text-[11px] tracking-widest text-magenta uppercase">
              Não é permitido
            </h3>
            <ul className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {NOT_ALLOWED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-chalk/90">
                  <Prohibit weight="bold" className="mt-0.5 h-5 w-5 shrink-0 text-magenta" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Aviso */}
        <Reveal delay={0.15}>
          <div
            className="mt-12 flex items-start gap-4 border border-grape/60 bg-plum px-6 py-5"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            <ShieldWarning weight="duotone" className="h-8 w-8 shrink-0 text-magenta" />
            <p className="text-sm leading-relaxed text-ash">
              Quem descumprir as regras pode ser retirado do evento, sem direito a reembolso.
              Não nos responsabilizamos por perda ou dano de pertences.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
