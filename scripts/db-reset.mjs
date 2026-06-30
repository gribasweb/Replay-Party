import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Sem DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

try {
  // Apaga pedidos e ingressos de teste. Os lotes (estoque) são preservados.
  await sql`DELETE FROM tickets`;
  await sql`DELETE FROM orders`;
  const [t] = await sql`select count(*)::int as n from tickets`;
  const [o] = await sql`select count(*)::int as n from orders`;
  const [l] = await sql`select count(*)::int as n from lots`;
  console.log(`Banco limpo. tickets=${t.n} | orders=${o.n} | lots=${l.n} (lotes preservados)`);
} catch (e) {
  console.error("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
