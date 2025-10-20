// Safely resolve any CSS color reference or name into a hex string before passing to MUI
export function resolveCssColor(value: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;

  let color = value.trim();

  // Resolve CSS var() references
  if (color.startsWith("var(")) {
    // Extract inside of var(...)
    const inner = color.slice(4, -1).trim();
    // Allow formats like var(--name) and var(--name, fallback)
    const [varName, varFallback] = inner.split(",");
    const cssVarName = (varName || "").trim();
    const cssVarFallback = (varFallback || "").trim();
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
    color = resolved || cssVarFallback || fallback;
  }

  // Convert named colors (e.g., "green") to rgb via a temporary element
  if (!color.startsWith("#") && !color.startsWith("rgb") && !color.startsWith("hsl")) {
    const temp = document.createElement("div");
    temp.style.color = color;
    document.body.appendChild(temp);
    const rgb = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    color = rgb || fallback;
  }

  // Convert rgb/rgba to hex for consistency
  if (color.startsWith("rgb")) {
    const nums = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const [r, g, b] = nums;
    color = `#${[r, g, b]
      .map((n) => (Number.isFinite(n) ? Math.max(0, Math.min(255, n)) : 0))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  // Optionally: handle hsl() -> hex here if ever needed

  return color || fallback;
}
