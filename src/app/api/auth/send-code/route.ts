import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { issueCode } from "@/lib/code-store";

export const runtime = "nodejs";

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

async function sendViaGmail(email: string, code: string): Promise<boolean> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  const msg = buildMessage(code);
  try {
    await transport.sendMail({
      from: `My Bloomy Life <${user}>`,
      to: email,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    return true;
  } catch (err) {
    console.error("Gmail SMTP send failed", err);
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

  const sent = await sendViaGmail(email, code);
  if (sent) return Response.json({ ok: true });

  // If Gmail credentials are configured but the send failed, surface the error
  // instead of silently falling back, so config problems are easy to debug.
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return Response.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  // Unconfigured mail transport.
  //
  // In production this is a hard failure. The previous behaviour returned the
  // code in the response body, which let anyone request a code for any address
  // and complete a login without ever receiving an email - the code in the
  // response was a complete bypass of the verification step.
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[My Bloomy Life] GMAIL_USER / GMAIL_APP_PASSWORD are not set; refusing to issue a code."
    );
    return Response.json({ ok: false, error: "email_unavailable" }, { status: 503 });
  }

  // Development only: no provider configured. Log the code so the flow can be
  // tested locally. The code is deliberately not returned to the caller.
  console.log(`[My Bloomy Life] Verification code for ${email} (${purpose}): ${code}`);
  return Response.json({ ok: true });
}
