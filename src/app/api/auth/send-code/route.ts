import { NextRequest } from "next/server";
import { issueCode } from "@/lib/code-store";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildMessage(code: string) {
  return {
    subject: "Your My Bloomy Life verification code",
    text: `Your verification code is: ${code}. It expires in 10 minutes.`,
    html: `<p>Your My Bloomy Life verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes.</p>`,
  };
}

// Send via Brevo (preferred: works with a verified sender email, no domain
// ownership required, free tier includes many sends/day).
async function sendViaBrevo(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  const from =
    process.env.BREVO_FROM_NAME && process.env.BREVO_FROM_EMAIL
      ? { name: process.env.BREVO_FROM_NAME, email: process.env.BREVO_FROM_EMAIL }
      : { name: "My Bloomy Life", email: process.env.BREVO_FROM_EMAIL || "" };
  if (!from.email) return false;
  const msg = buildMessage(code);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: from,
        to: [{ email }],
        subject: msg.subject,
        textContent: msg.text,
        htmlContent: msg.html,
      }),
    });
    if (!res.ok) {
      console.error("Brevo send failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Brevo error", err);
    return false;
  }
}

// Send via Resend (fallback provider).
async function sendViaResend(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const msg = buildMessage(code);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "My Bloomy Life <onboarding@resend.dev>",
        to: [email],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend error", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: { email?: string; purpose?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ignore malformed body
  }

  const email = (body.email || "").trim();
  const purpose = body.purpose === "register" ? "register" : "login";

  if (!isValidEmail(email)) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const code = issueCode(email, purpose);

  // Prefer Brevo, then Resend. Only when neither is configured fall back to
  // dev mode (log + return the code so the flow can still be exercised).
  const viaBrevo = await sendViaBrevo(email, code);
  if (viaBrevo) return Response.json({ ok: true });

  const viaResend = await sendViaResend(email, code);
  if (viaResend) return Response.json({ ok: true });

  // If a provider key exists but every send failed, surface the failure instead
  // of silently falling back (so it's easy to debug misconfiguration).
  if (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) {
    return Response.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  // Dev mode: no provider configured. Log the code so the flow can be tested.
  console.log(`[My Bloomy Life] Verification code for ${email} (${purpose}): ${code}`);
  return Response.json({ ok: true, devCode: code });
}
