"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { CheckCircle } from "@phosphor-icons/react";

/** Cabeçalho de sucesso do pedido: dispara confete e "carimba" CONFIRMADO. */
export function SuccessCelebration({ count }: { count: number }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const colors = ["#f90a79", "#7e03d8", "#efebef"];
    const t = setTimeout(() => {
      confetti({ particleCount: 80, spread: 75, startVelocity: 45, origin: { y: 0.3 }, colors });
      confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors });
      confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors });
    }, 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative text-center">
      <CheckCircle weight="fill" className="mx-auto h-14 w-14 text-violet" />
      <h1 className="mt-4 font-display text-4xl text-chalk uppercase sm:text-5xl">
        Ingresso{count > 1 ? "s" : ""} gerado{count > 1 ? "s" : ""}!
      </h1>
      <p className="mt-3 text-ash">Apresente o QR Code na entrada. Guarde esta página ou tire um print.</p>

      <motion.div
        initial={{ scale: 2.6, opacity: 0, rotate: -26 }}
        animate={{ scale: 1, opacity: 1, rotate: -11 }}
        transition={{ type: "spring", stiffness: 240, damping: 11, delay: 0.55 }}
        className="pointer-events-none absolute -top-2 right-1 select-none border-[3px] border-magenta px-3 py-1 font-display text-base tracking-[0.18em] text-magenta uppercase sm:right-8 sm:text-2xl"
        style={{ borderRadius: "6px", boxShadow: "inset 0 0 0 1px rgba(249,10,121,0.35)" }}
      >
        Confirmado
      </motion.div>
    </div>
  );
}
