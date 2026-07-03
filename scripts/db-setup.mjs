import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Sem DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

const ddl = [
  `DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending','paid','expired','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('valid','used','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `CREATE TABLE IF NOT EXISTS lots (
     id text PRIMARY KEY,
     tier text NOT NULL,
     tier_name text NOT NULL,
     lot_number integer NOT NULL,
     label text NOT NULL,
     price_cents integer NOT NULL,
     qty_total integer NOT NULL,
     starts_at timestamptz,
     ends_at timestamptz
   );`,
  `CREATE TABLE IF NOT EXISTS orders (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     buyer_name text NOT NULL,
     buyer_cpf text NOT NULL,
     buyer_email text NOT NULL,
     buyer_whatsapp text NOT NULL,
     total_cents integer NOT NULL,
     status order_status NOT NULL DEFAULT 'pending',
     payment_method text,
     mp_payment_id text,
     created_at timestamptz NOT NULL DEFAULT now(),
     expires_at timestamptz NOT NULL
   );`,
  // Idempotente: garante as colunas de pagamento mesmo em bancos criados antes.
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_payment_id text;`,
  `CREATE TABLE IF NOT EXISTS tickets (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     lot_id text NOT NULL REFERENCES lots(id),
     tier text NOT NULL,
     tier_name text NOT NULL,
     holder_name text NOT NULL,
     holder_cpf text NOT NULL,
     price_cents integer NOT NULL,
     qr_token text NOT NULL UNIQUE,
     status ticket_status NOT NULL DEFAULT 'valid',
     checked_in_at timestamptz
   );`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_lot ON tickets(lot_id);`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
  `CREATE TABLE IF NOT EXISTS mp_credentials (
     id text PRIMARY KEY,
     mp_user_id text,
     access_token text NOT NULL,
     refresh_token text,
     public_key text,
     expires_at timestamptz,
     updated_at timestamptz NOT NULL DEFAULT now()
   );`,
  `CREATE TABLE IF NOT EXISTS page_views (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     path text NOT NULL,
     referrer text,
     source text,
     visitor text,
     created_at timestamptz NOT NULL DEFAULT now()
   );`,
  `CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);`,
];

// Lotes (preços em centavos). Datas em horário de Brasília.
const LOTS = [
  ["pista-1", "pista", "Pista", 1, "1º Lote", 3000, 250, null, "2026-07-10T23:59:59-03:00"],
  ["pista-2", "pista", "Pista", 2, "2º Lote", 4500, 250, "2026-07-11T00:00:00-03:00", "2026-07-20T23:59:59-03:00"],
  ["pista-3", "pista", "Pista", 3, "3º Lote", 6000, 250, "2026-07-21T00:00:00-03:00", "2026-07-24T23:59:59-03:00"],
  ["vip-1", "vip", "VIP", 1, "1º Lote", 8000, 250, null, "2026-07-10T23:59:59-03:00"],
  ["vip-2", "vip", "VIP", 2, "2º Lote", 9500, 250, "2026-07-11T00:00:00-03:00", "2026-07-20T23:59:59-03:00"],
  ["vip-3", "vip", "VIP", 3, "3º Lote", 11000, 250, "2026-07-21T00:00:00-03:00", "2026-07-24T23:59:59-03:00"],
];

try {
  for (const stmt of ddl) await sql.unsafe(stmt);
  console.log("Tabelas e indices: OK");

  for (const [id, tier, tierName, lotNumber, label, price, qty, startsAt, endsAt] of LOTS) {
    await sql`
      insert into lots (id, tier, tier_name, lot_number, label, price_cents, qty_total, starts_at, ends_at)
      values (${id}, ${tier}, ${tierName}, ${lotNumber}, ${label}, ${price}, ${qty}, ${startsAt}, ${endsAt})
      on conflict (id) do update set
        price_cents = excluded.price_cents,
        qty_total = excluded.qty_total,
        label = excluded.label,
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at
    `;
  }
  console.log("Seed dos lotes: OK");

  const rows = await sql`select id, label, price_cents, qty_total from lots order by tier, lot_number`;
  console.log("\nLotes no banco:");
  for (const r of rows) {
    console.log(`  ${r.id.padEnd(8)} ${r.label.padEnd(8)} R$ ${(r.price_cents / 100).toFixed(2).padStart(7)}  estoque ${r.qty_total}`);
  }
} catch (e) {
  console.error("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
