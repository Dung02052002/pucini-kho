import { drizzle } from "drizzle-orm/d1";
import type { Bindings } from "../env";
import * as schema from "./schema";

export function getDb(env: Bindings) {
  return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof getDb>;
