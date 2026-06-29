import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { StatsBar } from "@/components/stats-bar";
import { Tickets } from "@/components/tickets";
import { HowItWorks } from "@/components/how-it-works";
import { WhyOnline } from "@/components/why-online";
import { Rules } from "@/components/rules";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Marquee />
        <StatsBar />
        <Tickets />
        <HowItWorks />
        <WhyOnline />
        <Rules />
      </main>
      <SiteFooter />
    </>
  );
}
