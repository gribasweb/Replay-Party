import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { StatsBar } from "@/components/stats-bar";
import { Tickets } from "@/components/tickets";
import { HowItWorks } from "@/components/how-it-works";
import { WhyOnline } from "@/components/why-online";
import { Rules } from "@/components/rules";
import { SiteFooter } from "@/components/site-footer";
import { tiersForDate } from "@/lib/event";

// Recalcula o lote ativo periodicamente — a oferta vira sozinha na data certa.
export const revalidate = 600;

export default function Home() {
  const tiers = tiersForDate(new Date());
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <StatsBar />
        <Tickets tiers={tiers} />
        <HowItWorks />
        <WhyOnline />
        <Rules />
      </main>
      <SiteFooter />
    </>
  );
}
