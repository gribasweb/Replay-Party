"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Revela cada ingresso "saindo/rasgando" de cima, em sequência. */
export function TicketReveal({ children, index }: { children: ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -28, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.55, delay: 0.6 + index * 0.18, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
