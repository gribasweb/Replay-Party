interface DiagonalBandProps {
  text: string;
  /** rotation in degrees */
  rotate: number;
  /** vertical position, e.g. "32%" */
  top: string;
  tone: "magenta" | "violet" | "ink";
  reverse?: boolean;
  durationSec?: number;
}

const TONES: Record<DiagonalBandProps["tone"], string> = {
  magenta: "bg-magenta text-ink",
  violet: "bg-violet text-chalk",
  ink: "bg-ink text-chalk ring-1 ring-inset ring-magenta/50",
};

/**
 * A single rotated tape that scrolls a repeating label. Two identical groups
 * inside one track give a seamless loop (track animates 0 to -50%). Pure CSS
 * animation; pauses under reduced motion in production via `.respect-reduced`.
 */
export function DiagonalBand({
  text,
  rotate,
  top,
  tone,
  reverse = false,
  durationSec = 24,
}: DiagonalBandProps) {
  const reps = Array.from({ length: 16 });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 w-[170%]"
      style={{ top, transform: `translateX(-50%) rotate(${rotate}deg)` }}
    >
      <div className={`flex overflow-hidden py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${TONES[tone]}`}>
        <div
          className={`flex shrink-0 ${reverse ? "band-track-rev" : "band-track"}`}
          style={{ animationDuration: `${durationSec}s` }}
        >
          {[0, 1].map((group) => (
            <div key={group} className="flex shrink-0 items-center">
              {reps.map((_, i) => (
                <span key={i} className="flex items-center">
                  <span className="font-display text-sm tracking-wide uppercase sm:text-base">
                    {text}
                  </span>
                  <span className="mx-5 opacity-60">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
