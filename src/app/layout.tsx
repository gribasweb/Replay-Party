import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/grain-overlay";
import { MotionProvider } from "@/components/motion-provider";
import { EVENT } from "@/lib/event";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${EVENT.name} · ${EVENT.dayLabel}.2026 · Campinas`,
  description:
    "Dois DJs, open bar e a pista mais quente de Campinas. Garanta seu ingresso para a Replay Party no dia 27 de julho. Pista e VIP, com pagamento via Pix e cartão.",
  openGraph: {
    title: `${EVENT.name} · 27 de julho · Campinas`,
    description:
      "Dois DJs, open bar e a pista mais quente de Campinas. Pista e VIP, pagamento via Pix e cartão.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#040406",
  colorScheme: "dark",
};

// CSS animations (marquee, hero bands) always play — they're part of the
// event's visual identity, matching the MotionProvider ("never") strategy.
const reducedClass = "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${reducedClass} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* SVG filter that gives display headlines their rough, sprayed edge */}
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
          <defs>
            <filter id="grunge">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.011 0.013"
                numOctaves={2}
                seed={7}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="3.5"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <GrainOverlay />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
