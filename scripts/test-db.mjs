import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Sem DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
try {
  const r = await sql`select current_database() as db, version() as v, now() as now`;
  console.log("CONEXAO OK");
  console.log("database:", r[0].db);
  console.log("version :", String(r[0].v).split(" ").slice(0, 2).join(" "));
  console.log("now     :", r[0].now);
  const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`;
  console.log("tabelas publicas:", tables.length ? tables.map((t) => t.table_name).join(", ") : "(nenhuma ainda)");
} catch (e) {
  console.error("ERRO DE CONEXAO:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
