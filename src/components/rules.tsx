"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CaretDown,
  CreditCard,
  IdentificationCard,
  ArrowsLeftRight,
  Storefront,
  WhatsappLogo,
  XCircle,
  type Icon,
} from "@phosphor-icons/react";
import { Reveal } from "@/components/reveal";

const FAQ: { icon: Icon; q: string; a: string }[] = [
  {
    icon: IdentificationCard,
    q: "Idade mínima: 16 anos",
    a: "A entrada é permitida a partir de 16 anos. Leve um documento oficial com foto, pode ser solicitado na portaria.",
  },
  {
    icon: XCircle,
    q: "Política de reembolso",
    a: "Não há reembolso após a confirmação da compra. Confira os dados antes de finalizar.",
  },
  {
    icon: ArrowsLeftRight,
    q: "Posso transferir meu ingresso?",
    a: "Sim. O ingresso pode ser transferido para outra pessoa caso você não possa comparecer.",
  },
  {
    icon: Storefront,
    q: "Venda na portaria",
    a: "Haverá venda no local pelo valor do 3º lote, tanto para a Pista quanto para o VIP, conforme disponibilidade.",
  },
  {
    icon: WhatsappLogo,
    q: "Como recebo meu ingresso?",
    a: "Você recebe na tela após o pagamento, por e-mail e por WhatsApp, com um QR Code para validar na entrada.",
  },
  {
    icon: CreditCard,
    q: "Formas de pagamento",
    a: "No site você paga com Pix ou cartão de crédito. Dinheiro somente na compra presencial, na portaria.",
  },
];

export function Rules() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="regras" className="scroll-mt-20 border-t border-grape/50 bg-coal py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-5xl leading-none text-chalk uppercase sm:text-6xl">
            Regras e informações
          </h2>
          <p className="mt-3 text-ash">Tudo o que você precisa saber antes de garantir o seu.</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 divide-y divide-grape/50 border-y border-grape/50">
            {FAQ.map(({ icon: Icon, q, a }, i) => {
              const isOpen = open === i;
              return (
                <div key={q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <Icon weight="bold" className={`h-5 w-5 shrink-0 transition-colors ${isOpen ? "text-magenta" : "text-violet"}`} />
                    <span className="flex-1 text-base font-medium text-chalk sm:text-lg">{q}</span>
                    <CaretDown
                      weight="bold"
                      className={`h-5 w-5 shrink-0 text-ash transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pl-9 text-sm text-ash sm:text-base">{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
