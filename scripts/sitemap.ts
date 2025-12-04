import "./load-env";
import { readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import db from "../src/lib/db";
import mongoose from "mongoose";
import Article from "../src/lib/models/Article";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const appDir = join(rootDir, "src/app/(app)");
const publicDir = join(rootDir, "public");

function getRoutes(dir: string, baseRoute = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  let routes: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes = routes.concat(getRoutes(join(dir, entry.name), `${baseRoute}/${entry.name}`));
    } else if (
      entry.isFile() &&
      (entry.name === "page.tsx" ||
        entry.name === "page.jsx" ||
        entry.name === "page.ts" ||
        entry.name === "page.js")
    ) {
      routes.push(baseRoute === "" ? "/" : baseRoute);
    }
  }
  routes = routes.concat([
    "/link/hector-tablero",
    "/link/jose-arbelaez",
    "/link/adam-maltoni",
    "/link/lorena-mohanu"
  ]);
  return routes;
}

const routes = getRoutes(appDir);

const baseUrl = "https://gdguam.es";

function generateSitemap(urls: string[]): string {
  const urlSet = urls
    .map(
      (route) => `
    <url>
        <loc>${baseUrl}${route}</loc>
    </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlSet}
</urlset>`;
}

function filterStaticRoutes(list: string[]): string[] {
  // Exclude any route that contains dynamic segments like [slug], [id], etc.
  return list.filter((r) => !r.includes("["));
}

async function getUrlOnlyBlogRoutes(): Promise<string[]> {
  try {
    await db.connect();
    // Select only slug to keep the query light
    const items = await Article.find({ type: "blog", status: "url_only" }).select("slug").lean();
    return (items || [])
      .map((it: { slug?: string }) => (it?.slug ? `/blog/${it.slug}` : null))
      .filter((v): v is string => !!v);
  } catch {
    return [];
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
  }
}

async function main() {
  const staticRoutes = filterStaticRoutes(routes);
  const urlOnlyBlogRoutes = await getUrlOnlyBlogRoutes();

  // Merge, de-duplicate, and sort for consistency
  const allRoutes = Array.from(new Set([...staticRoutes, ...urlOnlyBlogRoutes])).sort();

  const sitemap = generateSitemap(allRoutes);
  writeFileSync(join(publicDir, "sitemap.xml"), sitemap);
}

void main();

export {};
