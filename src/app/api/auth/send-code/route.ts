import { NextRequest } from "next/server";
import { issueCode } from "@/lib/code-store";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "MyBloom Life <onboarding@resend.dev>",
          to: [email],
          subject: "Your MyBloom Life verification code",
          text: `Your verification code is: ${code}. It expires in 10 minutes.`,
          html: `<p>Your MyBloom Life verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes.</p>`,
        }),
      });
      if (!res.ok) {
        console.error("Resend send failed", res.status, await res.text());
      }
    } catch (err) {
      console.error("Resend error", err);
    }
    return Response.json({ ok: true });
  }

  // Dev mode: no RESEND_API_KEY configured. Log the code so the flow can be
  // tested locally, and return it so the UI can show a demo hint.
  console.log(`[MyBloom Life] Verification code for ${email} (${purpose}): ${code}`);
  return Response.json({ ok: true, devCode: code });
}
