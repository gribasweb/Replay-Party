"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { List, Ticket, X } from "@phosphor-icons/react";

const LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Ingressos", href: "#ingressos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Regras", href: "#regras" },
  { label: "Contato", href: "#contato" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-grape/60 bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">
        <a href="#inicio" className="flex items-center gap-2" aria-label="Replay Party, início">
          <span className="grid h-9 w-9 place-items-center bg-magenta text-ink" style={{ borderRadius: "var(--radius-stamp)" }}>
            <Ticket weight="fill" className="h-5 w-5" />
          </span>
          <span className="font-display text-xl leading-none tracking-wide text-chalk">
            REPLAY<span className="text-magenta">PARTY</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium tracking-wide text-ash uppercase transition-colors hover:text-chalk"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/meus-ingressos"
            className="hidden border border-grape px-5 py-2.5 text-sm font-bold tracking-wide text-chalk uppercase transition-colors hover:border-magenta hover:text-magenta sm:inline-block"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            Meus ingressos
          </Link>
          <a
            href="#ingressos"
            className="hidden bg-magenta px-5 py-2.5 text-sm font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:inline-block"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            Comprar ingresso
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center text-chalk lg:hidden"
            aria-label="Abrir menu"
          >
            <List weight="bold" className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-ink/97 backdrop-blur-md lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-5">
              <span className="font-display text-xl tracking-wide text-chalk">
                REPLAY<span className="text-magenta">PARTY</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center text-chalk"
                aria-label="Fechar menu"
              >
                <X weight="bold" className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-2 px-6">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1 }}
                  className="font-display text-4xl tracking-wide text-chalk uppercase"
                >
                  {l.label}
                </motion.a>
              ))}
              <a
                href="#ingressos"
                onClick={() => setOpen(false)}
                className="mt-8 bg-magenta px-6 py-4 text-center text-base font-bold tracking-wide text-ink uppercase"
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                Comprar ingresso
              </a>
              <Link
                href="/meus-ingressos"
                onClick={() => setOpen(false)}
                className="mt-3 border border-grape px-6 py-4 text-center text-base font-bold tracking-wide text-chalk uppercase"
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                Meus ingressos
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
