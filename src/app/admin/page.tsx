import Link from "next/link";
import fs from "fs";
import path from "path";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";

interface TestRoute {
  label: string;
  href: string;
}

function getTestRoutes(): TestRoute[] {
  const routes: TestRoute[] = [];
  try {
    const testsDir = path.join(process.cwd(), "src", "app", "admin", "tests");
    const entries = fs.readdirSync(testsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("_")) continue;
      const pageFile = path.join(testsDir, entry.name, "page.tsx");
      if (fs.existsSync(pageFile)) {
        const pretty = entry.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        routes.push({ label: pretty, href: `/admin/tests/${entry.name}` });
      }
    }
  } catch {
    // ignore errors (folder may not exist)
  }
  return routes;
}

export default function AdminHome() {
  const testRoutes = getTestRoutes();
  return (
    <div style={{ padding: 24 }}>
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }]} />
      <h1 style={{ marginBottom: 16 }}>Admin</h1>
      <ul style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        <li>
          <Link href="/admin/blog">Manage Blog</Link>
        </li>
        <li>
          <Link href="/admin/newsletter">Manage Newsletter</Link>
        </li>
        <li>
          <Link href="/admin/events">Manage Events</Link>
        </li>
        <li>
          <Link href="/admin/giveaways">Manage Giveaways</Link>
        </li>
        <li>
          <Link href="/admin/games">Manage Games</Link>
        </li>
        <li>
          <Link href="/admin/links">Manage Links</Link>
        </li>
        <li>
          <Link href="/admin/permissions">Permissions</Link>
        </li>
        <li>
          <Link href="/admin/feature-flags">Feature Flags</Link>
        </li>
      </ul>
      {testRoutes.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 12, fontSize: 20 }}>Tests</h2>
          <ul style={{ display: "grid", gap: 6 }}>
            {testRoutes.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
