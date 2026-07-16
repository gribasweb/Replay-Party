/**
 * Central source of truth for the Replay Party event.
 * Everything the landing page renders comes from here, so prices, dates and
 * copy can change in one place. When the backend lands, lot `status` and
 * `sold`/`stock` will be computed dynamically instead of hard-coded.
 */

export type LotStatus = "past" | "active" | "upcoming";

export interface Lot {
  n: number;
  label: string;
  price: number;
  window: string;
  /** Data/hora em que este lote encerra (ISO, horário de Brasília). */
  endsAt: string;
  status: LotStatus;
}

export interface TicketTier {
  id: "pista" | "vip";
  name: string;
  tagline: string;
  accent: "violet" | "magenta";
  perks: string[];
  /** Stock available per lot. */
  perLotStock: number;
  lots: Lot[];
}

export const EVENT = {
  name: "Replay Party",
  // NOTE: confirm the start time with the client. The briefing reads "10:00 às 04:00".
  dateISO: "2026-07-24",
  dateLabel: "24 JUL 2026",
  dayLabel: "24.07",
  timeLabel: "10:00 às 04:00",
  minAge: 16,
  capacity: 1800,
  djCount: 2,
  venue: {
    name: "Chácara da Barra",
    street: "Rua Oriente, 425",
    district: "Chácara da Barra",
    city: "Campinas - SP",
    cep: "13090-740",
    mapsQuery: "Rua Oriente, 425 - Chácara da Barra, Campinas - SP, 13090-740",
  },
  social: {
    instagram: "@replayparty2026",
    instagramUrl: "https://instagram.com/replayparty2026",
    whatsappLabel: "(19) 99979-0405",
    whatsappUrl: "https://wa.me/5519999790405",
  },
} as const;

export const TICKETS: TicketTier[] = [
  {
    id: "pista",
    name: "Pista",
    tagline: "A energia da festa",
    accent: "violet",
    perLotStock: 250,
    perks: ["Acesso à pista", "Open bar (2h)", "Dois DJs a noite toda"],
    lots: [
      { n: 1, label: "1º Lote", price: 30, window: "até 02/07", endsAt: "2026-07-02T23:59:59-03:00", status: "past" },
      { n: 2, label: "2º Lote", price: 45, window: "até 15/07", endsAt: "2026-07-15T23:59:59-03:00", status: "past" },
      { n: 3, label: "3º Lote", price: 40, window: "16/07 até o dia do evento", endsAt: "2026-07-24T23:59:59-03:00", status: "active" },
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "A experiência completa",
    accent: "magenta",
    perLotStock: 250,
    perks: ["Área VIP exclusiva", "Open bar a noite toda", "Open food", "Dois DJs a noite toda"],
    lots: [
      { n: 1, label: "1º Lote", price: 80, window: "até 02/07", endsAt: "2026-07-02T23:59:59-03:00", status: "past" },
      { n: 2, label: "2º Lote", price: 95, window: "até 15/07", endsAt: "2026-07-15T23:59:59-03:00", status: "past" },
      { n: 3, label: "3º Lote", price: 120, window: "16/07 até o dia do evento", endsAt: "2026-07-24T23:59:59-03:00", status: "active" },
    ],
  },
];

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

/**
 * Retorna os tiers com o status de cada lote calculado pela data informada:
 * o primeiro lote ainda não encerrado fica "active", os anteriores "past" e os
 * seguintes "upcoming". Assim a oferta vira sozinha na data certa.
 */
export function tiersForDate(now: Date): TicketTier[] {
  const t = now.getTime();
  return TICKETS.map((tier) => {
    let activeAssigned = false;
    return {
      ...tier,
      lots: tier.lots.map((lot) => {
        let status: LotStatus;
        if (t > new Date(lot.endsAt).getTime()) {
          status = "past";
        } else if (!activeAssigned) {
          status = "active";
          activeAssigned = true;
        } else {
          status = "upcoming";
        }
        return { ...lot, status };
      }),
    };
  });
}
