import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase pooler works best with prepared statements disabled. The connection
// is lazy (postgres-js only connects on the first query), so importing this in
// build/SSR without DATABASE_URL set won't crash the build.
const connectionString = process.env.DATABASE_URL ?? "";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
