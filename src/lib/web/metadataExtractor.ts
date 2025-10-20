export interface PageHeadMeta {
  url: string;
  title?: string;
  description?: string;
  icon?: string;
}

// Fetch a page server-side and extract <title> and <meta name="description"> from <head>.
// Best-effort: returns null on network errors or non-HTML responses.
export async function getPageHead(
  url: string,
  opts?: { timeoutMs?: number }
): Promise<PageHeadMeta | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 6000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "GDG-UAM/website (+https://gdg-uam.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: controller.signal,
      redirect: "follow"
    });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;
    const html = await res.text();
    const finalUrl = res.url || url;
    // Extract <head> content quickly
    const headMatch = html.match(/<head[\s\S]*?>[\s\S]*?<\/head>/i);
    const head = headMatch ? headMatch[0] : html;
    // Extract <title>
    const titleMatch = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeHtml(titleMatch[1].trim()) : undefined;
    // Extract meta description
    const metaDescMatch = head.match(
      /<meta\b[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
    );
    const description = metaDescMatch ? decodeHtml(metaDescMatch[1].trim()) : undefined;
    // Extract icon candidates
    const icon = extractIcon(head, finalUrl);
    return { url: finalUrl, title, description, icon };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Try to pick the best icon from common link rels. Resolve relative URLs safely.
function extractIcon(headHtml: string, baseUrl: string): string | undefined {
  // Collect all link rel candidates with href
  const links: Array<{ rel: string; href: string; sizes?: string }> = [];
  const linkRe = /<link\b[^>]*rel=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(headHtml))) {
    const rel = m[1].toLowerCase();
    const href = m[2];
    const sizesMatch = m[0].match(/\bsizes=["']([^"']+)["']/i)?.[1];
    links.push({ rel, href, sizes: sizesMatch });
  }
  const order = [
    "apple-touch-icon",
    "apple-touch-icon-precomposed",
    "icon",
    "shortcut icon",
    "mask-icon"
  ];
  // Prefer larger sizes when available
  const scored = links
    .filter((l) => order.some((o) => l.rel.includes(o)))
    .map((l) => {
      const relScore = order.findIndex((o) => l.rel.includes(o));
      const size = parseIconSize(l.sizes);
      return { ...l, relScore: relScore === -1 ? 999 : relScore, size };
    })
    .sort((a, b) => a.relScore - b.relScore || b.size - a.size);
  const candidate = scored[0];
  if (!candidate) return undefined;
  try {
    return new URL(candidate.href, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function parseIconSize(s?: string): number {
  if (!s) return 0;
  // sizes like "180x180 152x152" -> pick max area edge
  const parts = s
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  let max = 0;
  for (const p of parts) {
    const m = p.match(/(\d+)[xX](\d+)/);
    if (m) {
      const n = Math.max(parseInt(m[1], 10), parseInt(m[2], 10));
      if (n > max) max = n;
    }
  }
  return max;
}
