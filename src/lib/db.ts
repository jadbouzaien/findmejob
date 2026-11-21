import postgres from "postgres";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "./env";

const g = globalThis as unknown as { __sql?: postgres.Sql };
export const sql = g.__sql ?? postgres(env.databaseUrl, { max: 5, onnotice: () => {} });
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export async function migrate() {
  const schema = readFileSync(resolve(process.cwd(), "src/db/schema.sql"), "utf8");
  await sql.unsafe(schema);
}

export async function getSetting(key: string): Promise<string | null> {
  const rows = await sql<{ value: string }[]>`select value from settings where key = ${key}`;
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await sql`insert into settings (key, value) values (${key}, ${value})
            on conflict (key) do update set value = excluded.value`;
}
