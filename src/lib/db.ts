// Server-only Neon client for MyBloom Life.
// All persistence goes through a single key -> value table that mirrors the
// slots that used to live in localStorage, so the whole app can sync across
// devices with a minimal change to the shared storage layer.

import { neon } from "@neondatabase/serverless";

// Ensure this module is only ever bundled on the server (Next route handlers).
const isServer = typeof window === "undefined";

const url = process.env.DATABASE_URL;
export const hasDb = isServer && !!url;

// `neon` is a fetch-based (serverless-friendly) Postgres driver.
export const sql = isServer && url ? neon(url) : null;

let schemaEnsured = false;

// Create the single sync table on first use so there is no manual migration step.
export async function ensureSchema(): Promise<boolean> {
  if (!sql) return false;
  if (schemaEnsured) return true;
  schemaEnsured = true;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bloom_state (
        id         TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS bloom_state_updated_idx ON bloom_state (updated_at)
    `;
    return true;
  } catch (e) {
    console.error("[db] ensureSchema failed:", e);
    return false;
  }
}

export interface SyncRow {
  key: string;
  value: string;
}

// Read the whole remote state map: key -> raw string value.
export async function loadAllState(): Promise<Record<string, string>> {
  if (!sql) return {};
  const rows = (await sql`SELECT id, value FROM bloom_state`) as { id: string; value: string }[];
  const state: Record<string, string> = {};
  for (const row of rows) state[row.id] = row.value;
  return state;
}

// Upsert a set of rows. Empty value encodes a deletion (tombstone).
export async function upsertRows(rows: SyncRow[]): Promise<number> {
  if (!sql || rows.length === 0) return 0;
  const ids = rows.map((r) => r.key);
  const vals = rows.map((r) => r.value);
  await sql`
    INSERT INTO bloom_state (id, value, updated_at)
    SELECT id, value, now() FROM UNNEST(${ids}, ${vals}) AS t(id, value)
    ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
  return ids.length;
}