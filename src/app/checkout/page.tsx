import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lots } from "@/lib/db/schema";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ lot?: string }>;
}) {
  const { lot: lotId } = await searchParams;

  let lot = null;
  if (lotId) {
    const [row] = await db.select().from(lots).where(eq(lots.id, lotId));
    lot = row ?? null;
  }

  if (!lot) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 text-center">
        <div>
          <h1 className="font-display text-4xl text-chalk uppercase">Ingresso não encontrado</h1>
          <p className="mt-3 text-ash">Volte e escolha um setor para continuar.</p>
          <Link
            href="/#ingressos"
            className="mt-6 inline-block bg-magenta px-6 py-3 text-sm font-bold tracking-wide text-ink uppercase"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            Ver ingressos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <CheckoutForm
      lot={{
        id: lot.id,
        tier: lot.tier,
        tierName: lot.tierName,
        label: lot.label,
        priceCents: lot.priceCents,
      }}
    />
  );
}
