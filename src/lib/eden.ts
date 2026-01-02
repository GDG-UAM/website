import { treaty } from "@elysiajs/eden";
import type { App } from "@/elysia";

const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const client = treaty<App>(origin);

export const api = client.api;
