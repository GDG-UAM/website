import { Elysia, t } from "elysia";
import { verifyTokenForHeaders, revokeToken } from "@/lib/controllers/csrfController";
import { sendContactEmail } from "@/lib/mail/brevo";
import { ContactFormBody } from "../models/contact";

export const contactRoutes = new Elysia({ prefix: "/contact" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .post(
    "/",
    async ({ headers, body, status }) => {
      try {
        const token = headers["x-csrf-token"];
        if (!(await verifyTokenForHeaders(headers, token))) {
          return status(403, "invalid csrf");
        }

        const { type, name, email, message, orgName, website } = body;

        const payload = {
          type: type === "sponsor" ? "sponsor" : "personal",
          name,
          email,
          message,
          orgName,
          website
        } as const;

        await sendContactEmail(payload);
        try {
          if (token) await revokeToken(token);
        } catch {}
        return status(200, { ok: true });
      } catch (err) {
        return status(400, String(err ?? "bad request"));
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: ContactFormBody,
      response: {
        200: t.Object({ ok: t.Boolean() }),
        400: t.String(),
        403: t.String()
      }
    }
  );
