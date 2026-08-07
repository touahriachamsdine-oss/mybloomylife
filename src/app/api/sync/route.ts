import { NextRequest } from "next/server";
import { ensureSchema, loadAllState, upsertRows, hasDb } from "@/lib/db";

// GET  -> return the entire remote state map (key -> raw string value).
// POST -> upsert a batch of { rows: [{ key, value }] } (empty value = delete).
export async function GET() {
  if (!hasDb) {
    return Response.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const ok = await ensureSchema();
  if (!ok) return Response.json({ ok: false, error: "db_error" }, { status: 500 });
  try {
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