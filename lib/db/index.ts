import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function createDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env.local.");
  }

  return drizzle({ client: neon(url), schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

// Initialize on first use so pages without database queries work before setup.
export function getDb() {
  return (database ??= createDatabase());
}
