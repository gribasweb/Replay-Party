import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", ["pending", "paid", "expired", "cancelled"]);
export const ticketStatus = pgEnum("ticket_status", ["valid", "used", "cancelled"]);

/**
 * Lots (lotes). One row per tier+lot, e.g. "pista-1". Stock is `qtyTotal`;
 * the amount available is computed at runtime from paid + active-reserved
 * tickets, so we never oversell.
 */
export const lots = pgTable("lots", {
  id: text("id").primaryKey(), // e.g. "pista-1"
  tier: text("tier").notNull(), // "pista" | "vip"
  tierName: text("tier_name").notNull(), // "Pista" | "VIP"
  lotNumber: integer("lot_number").notNull(),
  label: text("label").notNull(), // "1º Lote"
  priceCents: integer("price_cents").notNull(),
  qtyTotal: integer("qty_total").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

/** A purchase. Holds the buyer (who paid) and the payment status. */
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerName: text("buyer_name").notNull(),
  buyerCpf: text("buyer_cpf").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerWhatsapp: text("buyer_whatsapp").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: orderStatus("status").notNull().default("pending"),
  paymentMethod: text("payment_method"), // "pix" | "credit_card" | "debit_card"
  mpPaymentId: text("mp_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // Temporary reservation window: while pending and not expired the tickets
  // hold their spot in stock.
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** One ticket per attendee. Nominal (holder name + CPF) and a unique QR token. */
export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  lotId: text("lot_id")
    .notNull()
    .references(() => lots.id),
  tier: text("tier").notNull(),
  tierName: text("tier_name").notNull(),
  holderName: text("holder_name").notNull(),
  holderCpf: text("holder_cpf").notNull(),
  priceCents: integer("price_cents").notNull(),
  qrToken: text("qr_token").notNull().unique(),
  status: ticketStatus("status").notNull().default("valid"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
});

/**
 * Credencial do VENDEDOR (organizador) obtida via OAuth do Mercado Pago.
 * Linha única (id = "vendor"). Os pagamentos são criados na conta do vendedor
 * com o nosso application_fee de 15% (Split de Pagamentos / marketplace).
 */
export const mpCredentials = pgTable("mp_credentials", {
  id: text("id").primaryKey(), // sempre "vendor"
  mpUserId: text("mp_user_id"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  publicKey: text("public_key"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Acessos ao site (anônimo, sem cookie) para o contador no painel. */
export const pageViews = pgTable("page_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  source: text("source"), // instagram | whatsapp | direto | google | ...
  visitor: text("visitor"), // hash anônimo (ip+ua+dia), sem guardar IP cru
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Lot = typeof lots.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type MpCredentials = typeof mpCredentials.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;
