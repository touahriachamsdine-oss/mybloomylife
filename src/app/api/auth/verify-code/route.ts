import { NextRequest } from "next/server";
import { checkCode } from "@/lib/code-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string; purpose?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ignore malformed body
  }

  const email = (body.email || "").trim();
  const code = (body.code || "").trim();
  const purpose = body.purpose === "register" ? "register" : "login";

  if (!email || !code) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  // Async now: the code lives in Postgres so that the instance that issued it
  // is not required to be the instance that verifies it.
  const result = await checkCode(email, code, purpose);
  if (!result.valid) {
    if (result.reason === "storage_unavailable") {
      return Response.json({ ok: false, error: "storage_unavailable" }, { status: 503 });
    }
    if (result.reason === "too_many_attempts") {
      return Response.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }
    return Response.json({ ok: false, error: result.reason || "invalid_code" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
