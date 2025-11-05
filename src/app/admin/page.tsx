import fs from "fs";
import path from "path";
import AdminContent from "@/components/pages/admin/AdminContent";

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
    <div style={{ padding: 20 }}>
      <AdminContent testRoutes={testRoutes} />
    </div>
  );
}
