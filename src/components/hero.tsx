"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, CalendarBlank, GridFour, MapPin, Ticket } from "@phosphor-icons/react";
import { EVENT } from "@/lib/event";
import { DiagonalBand } from "@/components/diagonal-band";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const sceneY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  // Parallax só no desktop: no mobile ele engasga o scroll e faz a imagem
  // "respirar" junto com a barra do navegador que aparece/some.
  const [parallaxOn, setParallaxOn] = useState(false);
  useEffect(() => {
    setMounted(true);
    setParallaxOn(window.matchMedia("(min-width: 768px)").matches);
  }, []);
  const y = mounted && parallaxOn ? sceneY : "0%";

  return (
    <section id="inicio" ref={ref} className="relative min-h-[100svh] overflow-hidden bg-ink">
      {/* Layer 1 — background photo (already color-graded by the client) */}
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <Image src="/fundo.webp" alt="" fill priority sizes="100vw" className="hidden object-cover object-[center_60%] md:block" />
        <Image src="/fundo-celular.webp" alt="" fill priority sizes="100vw" className="object-cover object-center md:hidden" />
      </motion.div>

      {/* Darken top + bottom for text legibility, keep the middle clear */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,4,6,0.5) 0%, rgba(4,4,6,0.05) 32%, rgba(4,4,6,0.12) 58%, rgba(4,4,6,0.82) 100%)",
        }}
      />

      {/* Layer 2 — band behind the DJ (desktop fixo, mobile ajustável) */}
      <div className="absolute inset-0 z-10">
        <div className="hidden md:block">
          <DiagonalBand text="Replay Party" rotate={-11} top="57%" tone="violet" durationSec={26} />
        </div>
        <div className="md:hidden">
          <DiagonalBand text="Replay Party" rotate={-10} top="42%" tone="violet" durationSec={26} />
        </div>
      </div>

      {/* Layer 3 — DJ cut-out, aligned with the background */}
      <motion.div style={{ y }} className="absolute inset-0 z-20">
        <Image src="/dj.webp" alt="DJ no palco" fill priority sizes="100vw" className="hidden object-cover object-[center_60%] md:block" />
        <Image src="/dj-celular.webp" alt="DJ no palco" fill priority sizes="100vw" className="object-cover object-center md:hidden" />
      </motion.div>

      {/* Layer 4 — band in front of the DJ (desktop fixo, mobile ajustável) */}
      <div className="absolute inset-0 z-30">
        <div className="hidden md:block">
          <DiagonalBand text="Garanta seu ingresso" rotate={11} top="57%" tone="magenta" reverse durationSec={22} />
        </div>
        <div className="md:hidden">
          <DiagonalBand text="Garanta seu ingresso" rotate={10} top="42%" tone="magenta" reverse durationSec={22} />
        </div>
      </div>

      {/* Layer 5 — content (logo + tagline live inside the image) */}
      <div className="relative z-40 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col items-center justify-end px-5 pb-14 pt-20 text-center lg:pb-20 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-sm text-chalk [text-shadow:0_2px_12px_rgba(4,4,6,0.9)]">
            <span className="flex items-center gap-2">
              <CalendarBlank weight="bold" className="h-5 w-5 text-magenta" />
              {EVENT.dateLabel}
            </span>
            <span className="hidden h-4 w-px bg-chalk/30 sm:block" />
            <span className="flex items-center gap-2">
              <MapPin weight="bold" className="h-5 w-5 text-magenta" />
              {EVENT.venue.city}
            </span>
            <span className="hidden h-4 w-px bg-chalk/30 sm:block" />
            <span className="rounded-sm border border-chalk/30 px-2 py-0.5 text-magenta">
              {EVENT.minAge}+
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#ingressos"
              className="glow-magenta group flex items-center gap-2 bg-magenta px-7 py-4 text-sm font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              Comprar ingresso
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            {/* Desktop/tablet: Ver setores. Mobile: Meus ingressos (no header fica oculto) */}
            <a
              href="#ingressos"
              className="hidden items-center gap-2 border border-chalk/40 bg-ink/30 px-7 py-4 text-sm font-bold tracking-wide text-chalk uppercase backdrop-blur-sm transition-colors hover:border-chalk hover:bg-chalk/10 sm:flex"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              <GridFour weight="bold" className="h-5 w-5" />
              Ver setores
            </a>
            <Link
              href="/meus-ingressos"
              className="flex items-center gap-2 border border-chalk/40 bg-ink/30 px-7 py-4 text-sm font-bold tracking-wide text-chalk uppercase backdrop-blur-sm transition-colors hover:border-chalk hover:bg-chalk/10 sm:hidden"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              <Ticket weight="bold" className="h-5 w-5" />
              Meus ingressos
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
