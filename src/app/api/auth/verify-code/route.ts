import { NextRequest } from "next/server";
import { checkCode } from "@/lib/code-store";

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

  const result = checkCode(email, code, purpose);
  if (!result.valid) {
    return Response.json({ ok: false, error: result.reason || "invalid_code" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
