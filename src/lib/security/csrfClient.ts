async function fetchToken(endpoint: string): Promise<{ token: string; exp: number } | null> {
  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as { token?: string; expiresAt?: string };
    if (!j.token) return null;
    const exp = j.expiresAt ? Date.parse(j.expiresAt) : Date.now() + 4 * 60 * 1000; // default ~4m
    return { token: j.token, exp };
  } catch {
    return null;
  }
}

async function getTokenFrom(endpoint: string): Promise<string | null> {
  const fresh = await fetchToken(endpoint);
  if (!fresh) return null;
  return fresh.token;
}

// Default admin (user-bound) token helpers
async function getCsrfToken(): Promise<string | null> {
  return getTokenFrom("/api/csrf");
}

export async function withCsrfHeaders(headers: HeadersInit = {}): Promise<HeadersInit | undefined> {
  const token = await getCsrfToken();
  if (!token) return headers;
  return { ...headers, "x-csrf-token": token };
}

async function getAnonymousCsrfToken(): Promise<string | null> {
  return getTokenFrom("/api/csrf/public");
}

export async function withAnonymousCsrfHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit | undefined> {
  const token = await getAnonymousCsrfToken();
  if (!token) return headers;
  return { ...headers, "x-csrf-token": token };
}
