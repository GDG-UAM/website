import { NextRequest, NextResponse } from "next/server";
import { renderMarkdown } from "@/lib/markdown";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function POST(req: NextRequest) {
  try {
    // Admin-only helper endpoint; enforce user-bound CSRF for POST
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let text = "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      text = String(body?.text ?? "");
    } else {
      text = await req.text();
    }
    const { html } = await renderMarkdown(text);
    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    console.error("/api/admin/markdown error:", err);
    return new Response(JSON.stringify({ error: "Markdown render failed" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
