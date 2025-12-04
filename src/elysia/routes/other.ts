import { Elysia, t } from "elysia";

export const otherRoutes = new Elysia()
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/fetch-page-title",
    async ({ query: { url }, status }) => {
      if (!url) {
        return status(400, { error: "URL parameter is required" });
      }

      try {
        // Validate URL
        new URL(url);

        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; GDG-UAM-Bot/1.0; +https://gdguam.com)"
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok)
          return status(response.status as 400 | 404 | 500, { error: "Failed to fetch page" });

        const html = await response.text();
        let title: string | null = null;
        const ogTitleMatch = html.match(
          /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
        );
        if (ogTitleMatch) title = ogTitleMatch[1];

        if (!title) {
          const twitterTitleMatch = html.match(
            /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i
          );
          if (twitterTitleMatch) title = twitterTitleMatch[1];
        }

        if (!title) {
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) title = titleMatch[1];
        }

        if (!title) return status(404, { error: "No title found" });

        title = title
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, " ")
          .trim();

        return status(200, { title });
      } catch (error) {
        console.error("Error fetching page title:", error);
        return status(500, { error: "Failed to fetch page title" });
      }
    },
    {
      query: t.Object({
        url: t.String()
      }),
      response: {
        200: t.Object({ title: t.String() }),
        400: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
