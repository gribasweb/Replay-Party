import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { CalendarBlank, CheckCircle, MapPin, XCircle } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { EVENT } from "@/lib/event";
import { onlyDigits } from "@/lib/cpf";
import { baseUrlFromHeaders } from "@/lib/base-url";

export const dynamic = "force-dynamic";

const maskCpf = (cpf: string) => {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
};

export default async function IngressoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let ticket = null;
  try {
    [ticket] = await db.select().from(tickets).where(eq(tickets.qrToken, token));
  } catch {
    ticket = null;
  }

  if (!ticket) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 text-center">
        <div>
          <XCircle weight="fill" className="mx-auto h-14 w-14 text-magenta" />
          <h1 className="mt-4 font-display text-4xl text-chalk uppercase">Ingresso inválido</h1>
          <p className="mt-2 text-ash">Este QR Code não corresponde a nenhum ingresso.</p>
        </div>
      </main>
    );
  }

  const used = ticket.status === "used";
  const cancelled = ticket.status === "cancelled";
  const baseUrl = await baseUrlFromHeaders();
  const qr = await QRCode.toDataURL(`${baseUrl}/ingresso/${ticket.qrToken}`, {
    margin: 1,
    width: 320,
    color: { dark: "#040406", light: "#ffffff" },
  });

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden border border-grape bg-plum" style={{ borderRadius: "var(--radius-stamp)" }}>
          <div className="flex items-center justify-between bg-gradient-to-r from-grape/60 to-plum px-5 py-3">
            <span className="font-display text-xl tracking-wide text-chalk">
              REPLAY<span className="text-magenta">PARTY</span>
            </span>
            <span className="font-display text-xl text-chalk uppercase">{ticket.tierName}</span>
          </div>

          <div className="flex flex-col items-center p-6">
            <div className="bg-white p-3" style={{ borderRadius: "var(--radius-stamp)" }}>
              <Image src={qr} alt="QR Code" width={180} height={180} unoptimized className={used || cancelled ? "opacity-30" : ""} />
            </div>

            <div className="mt-5 w-full text-center">
              <div className="font-mono text-[11px] tracking-widest text-ash uppercase">Participante</div>
              <div className="font-display text-2xl leading-tight text-chalk">{ticket.holderName}</div>
              <div className="mt-1 font-mono text-sm text-ash">CPF {maskCpf(ticket.holderCpf)}</div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-xs text-ash">
              <span className="flex items-center gap-1.5">
                <CalendarBlank weight="bold" className="h-4 w-4 text-magenta" />
                {EVENT.dateLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin weight="bold" className="h-4 w-4 text-magenta" />
                {EVENT.venue.city}
              </span>
            </div>

            <div
              className={`mt-5 flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest uppercase ${
                used
                  ? "bg-magenta/15 text-magenta"
                  : cancelled
                    ? "bg-ash/15 text-ash"
                    : "bg-violet/15 text-violet"
              }`}
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              {used ? (
                <>
                  <XCircle weight="fill" className="h-4 w-4" /> Já utilizado
                </>
              ) : cancelled ? (
                <>Cancelado</>
              ) : (
                <>
                  <CheckCircle weight="fill" className="h-4 w-4" /> Válido
                </>
              )}
            </div>
          </div>
          <div className="barcode h-7 opacity-70" aria-hidden />
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-ash hover:text-chalk">
            Ir para o site
          </Link>
        </div>
      </div>
    </main>
  );
}
