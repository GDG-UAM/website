import { Elysia, t } from "elysia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBlurHash } from "@/lib/utils/blurhash";
import { BlurHashTestBody, BlurHashTestResponse } from "../../models/admin/tests";

export const adminTestsRoutes = new Elysia({ prefix: "/tests" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .onBeforeHandle(({ status }) => {
    if (process.env.NODE_ENV !== "development") return status(404, { error: "Not Found" });
  })
  .post(
    "/blurhash",
    async ({ body, status }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user) return status(401, { error: "Unauthorized" });

      try {
        const { url } = body;
        if (!url) return status(400, { error: "URL is required" });

        try {
          new URL(url);
        } catch {
          return status(400, { error: "Invalid URL format" });
        }

        const startTime = Date.now();

        const blurResult = await generateBlurHash(url);

        const processingTime = Date.now() - startTime;
        return {
          blurHash: blurResult?.blurHash ?? null,
          width: blurResult?.width ?? null,
          height: blurResult?.height ?? null,
          processingTime,
          success: !!blurResult
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to generate BlurHash";
        return status(500, { error: msg });
      }
    },
    {
      body: BlurHashTestBody,
      response: {
        200: BlurHashTestResponse,
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
