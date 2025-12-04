import { api } from "@/lib/eden";

async function fetchToken(type: "user" | "public"): Promise<{ token: string; exp: number } | null> {
  try {
    const { data, error } =
      type === "user"
        ? await api.csrf.get({ fetch: { cache: "no-store" } })
        : await api.csrf.public.get({ fetch: { cache: "no-store" } });

    if (error || !data) return null;

    const exp = data.expiresAt ? Date.parse(data.expiresAt) : Date.now() + 4 * 60 * 1000; // default ~4m
    return { token: data.token, exp };
  } catch {
    return null;
  }
}

async function getTokenFrom(type: "user" | "public"): Promise<string | null> {
  const fresh = await fetchToken(type);
  if (!fresh) return null;
  return fresh.token;
}

// Default admin (user-bound) token helpers
export async function getCsrfToken(): Promise<string | null> {
  return getTokenFrom("user");
}

export async function withCsrfHeaders(headers: HeadersInit = {}): Promise<HeadersInit | undefined> {
  const token = await getCsrfToken();
  if (!token) return headers;
  return { ...headers, "x-csrf-token": token };
}

export async function getAnonymousCsrfToken(): Promise<string | null> {
  return getTokenFrom("public");
}

export async function withAnonymousCsrfHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit | undefined> {
  const token = await getAnonymousCsrfToken();
  if (!token) return headers;
  return { ...headers, "x-csrf-token": token };
}
