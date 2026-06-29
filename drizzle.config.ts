import type { Config } from "drizzle-kit";

// drizzle-kit reads DATABASE_URL from the environment. For local migrations,
// run with the var set (or via a .env loader). Use the Supabase DIRECT
// connection string (port 5432) for migrations, not the pooler (6543).
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
} satisfies Config;
