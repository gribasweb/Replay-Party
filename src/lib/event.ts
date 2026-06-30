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
  /** Stock available per lot (from the briefing: 75 per lot). */
  perLotStock: number;
  lots: Lot[];
}

export const EVENT = {
  name: "Replay Party",
  // NOTE: confirm the start time with the client. The briefing reads "10:00 às 04:00".
  dateISO: "2026-07-25",
  dateLabel: "25 JUL 2026",
  dayLabel: "25.07",
  timeLabel: "10:00 às 04:00",
  minAge: 18,
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
    // TODO: replace with the real handles/number before launch.
    instagram: "@replay.party.oficial",
    instagramUrl: "https://instagram.com/replay.party.oficial",
    whatsappLabel: "(19) 99999-9999",
    whatsappUrl: "https://wa.me/5519999999999",
  },
} as const;

export const TICKETS: TicketTier[] = [
  {
    id: "pista",
    name: "Pista",
    tagline: "A energia da festa",
    accent: "violet",
    perLotStock: 75,
    perks: ["Acesso à pista", "Open bar", "Dois DJs a noite toda"],
    lots: [
      { n: 1, label: "1º Lote", price: 30, window: "até 10/07", endsAt: "2026-07-10T23:59:59-03:00", status: "active" },
      { n: 2, label: "2º Lote", price: 45, window: "11/07 a 20/07", endsAt: "2026-07-20T23:59:59-03:00", status: "upcoming" },
      { n: 3, label: "3º Lote", price: 60, window: "21/07 até o dia do evento", endsAt: "2026-07-25T23:59:59-03:00", status: "upcoming" },
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "A experiência completa",
    accent: "magenta",
    perLotStock: 75,
    perks: ["Área VIP exclusiva", "Open bar", "Open food", "Dois DJs a noite toda"],
    lots: [
      { n: 1, label: "1º Lote", price: 80, window: "até 10/07", endsAt: "2026-07-10T23:59:59-03:00", status: "active" },
      { n: 2, label: "2º Lote", price: 95, window: "11/07 a 20/07", endsAt: "2026-07-20T23:59:59-03:00", status: "upcoming" },
      { n: 3, label: "3º Lote", price: 110, window: "21/07 até o dia do evento", endsAt: "2026-07-25T23:59:59-03:00", status: "upcoming" },
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
