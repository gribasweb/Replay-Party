import { EVENT } from "@/lib/event";

const ITEMS = [
  EVENT.name,
  `${EVENT.dayLabel}.2026`,
  "Campinas - SP",
  "Dois DJs",
  "Open Bar",
  "Pista + VIP",
  "16+",
];

/**
 * Kinetic marquee. One per page (logo/keyword strip). Pure CSS animation,
 * duplicated content for a seamless loop. Pauses under reduced motion.
 */
export function Marquee() {
  const row = [...ITEMS, ...ITEMS];

  return (
    <div className="relative flex overflow-hidden border-y border-grape/60 bg-violet py-3 select-none">
      <div className="animate-marquee flex shrink-0 items-center gap-6 whitespace-nowrap pr-6">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-6">
            <span className="font-display text-lg tracking-wide text-chalk uppercase">
              {item}
            </span>
            <span className="text-magenta" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
      <div
        className="animate-marquee flex shrink-0 items-center gap-6 whitespace-nowrap pr-6"
        aria-hidden
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-6">
            <span className="font-display text-lg tracking-wide text-chalk uppercase">
              {item}
            </span>
            <span className="text-magenta">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
