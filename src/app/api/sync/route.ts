import { NextRequest } from "next/server";
import { ensureSchema, loadAllState, upsertRows, hasDb, sql } from "@/lib/db";
import { seedDemoAccounts, DEMO_ACCOUNTS } from "@/lib/auth";

const REGISTERED_USERS_KEY = "bloom_registered_users";

// Blend the demo accounts into the shared store. Every demo email is ensured
// to exist (added if missing) so fresher credentials are available on every
// device without wiping users that were registered by hand.
//
// Development only. In production this silently re-created demo logins inside
// the real database on every sync, so anyone who knew the published demo
// addresses could sign in as a psychologist or a parent and read real student
// data. Without this gate there is no way to tell a demo account from a real
// one, because both live in the same user table.
async function ensureDemoUsers(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  if (!sql || !loadAllState) return;
  try {
    const state = await loadAllState();
    const raw = state[REGISTERED_USERS_KEY];
    let users: { email: string; name: string; role: string }[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) users = parsed;
      } catch {
        users = [];
      }
    }
    const existingEmails = new Set(users.map(u => u.email));
    const missingEmails = DEMO_ACCOUNTS.filter(a => !existingEmails.has(a.email)).map(a => a.email);
    if (missingEmails.length === 0) return;
    const seeded = await seedDemoAccounts();
    const toAdd = seeded.filter(a => missingEmails.includes(a.email));
    await upsertRows([{ key: REGISTERED_USERS_KEY, value: JSON.stringify([...users, ...toAdd]) }]);
  } catch (e) {
    console.error("[api/sync] ensure demo users failed", e);
  }
}

// GET  -> return the entire remote state map (key -> raw string value).
// POST -> upsert a batch of { rows: [{ key, value }] } (empty value = delete).
export async function GET() {
  if (!hasDb) {
    return Response.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const ok = await ensureSchema();
  if (!ok) return Response.json({ ok: false, error: "db_error" }, { status: 500 });
  try {
    await ensureDemoUsers();
    const state = await loadAllState();
    return Response.json({ ok: true, state });
  } catch (e) {
    console.error("[api/sync] GET error", e);
    return Response.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasDb) {
    return Response.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const ok = await ensureSchema();
  if (!ok) return Response.json({ ok: false, error: "db_error" }, { status: 500 });

  let body: { rows?: { key: string; value: string }[] } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const rows = Array.isArray(body.rows) ? body.rows.filter((r) => r && typeof r.key === "string") : [];
  if (rows.length === 0) return Response.json({ ok: true, written: 0 });

  try {
    const written = await upsertRows(rows);
    return Response.json({ ok: true, written });
  } catch (e) {
    console.error("[api/sync] POST error", e);
    return Response.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}