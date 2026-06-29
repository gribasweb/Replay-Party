"use client";

import { motion } from "motion/react";
import { BeerStein, ForkKnife, MusicNotes, Users, type Icon } from "@phosphor-icons/react";
import { EVENT } from "@/lib/event";

const STATS: { icon: Icon; value: string; label: string }[] = [
  { icon: Users, value: EVENT.capacity.toLocaleString("pt-BR"), label: "Capacidade" },
  { icon: MusicNotes, value: `${EVENT.djCount} DJs`, label: "A noite toda" },
  { icon: BeerStein, value: "Open Bar", label: "Pista e VIP" },
  { icon: ForkKnife, value: "Open Food", label: "Exclusivo VIP" },
];

export function StatsBar() {
  return (
    <section className="border-y border-grape/50 bg-coal">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-grape/40 md:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 bg-coal px-5 py-7 lg:px-8 lg:py-9"
          >
            <Icon weight="bold" className="h-8 w-8 shrink-0 text-violet" />
            <div>
              <div className="font-display text-2xl leading-none text-chalk lg:text-3xl">
                {value}
              </div>
              <div className="mt-1 font-mono text-[11px] tracking-widest text-ash uppercase">
                {label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
