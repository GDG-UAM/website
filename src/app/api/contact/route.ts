import { NextRequest, NextResponse } from "next/server";
import { verifyTokenForHeaders, revokeToken } from "@/lib/controllers/csrfController";
import { sendContactEmail } from "@/lib/mail/brevo";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-csrf-token");
    if (!(await verifyTokenForHeaders(req.headers, token))) {
      return new NextResponse("invalid csrf", { status: 403 });
    }

    const body = await req.json();
    // Normalize payload to ContactPayload shape
    const payload = {
      type: body.type === "sponsor" ? "sponsor" : "personal",
      name: body.name,
      email: body.email,
      message: body.message,
      orgName: body.orgName,
      website: body.website
    } as const;

    await sendContactEmail(payload);
    try {
      if (token) await revokeToken(token);
    } catch {}
    return NextResponse.json({ ok: true });
  } catch (err) {
    return new NextResponse(String(err ?? "bad request"), { status: 400 });
  }
}
