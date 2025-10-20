import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

// Read-only access to NODE_ENV; default behavior handled by dotenv fallbacks

const cwd = process.cwd();
const envLocal = resolve(cwd, ".env.local");
const env = resolve(cwd, ".env");

// Load .env.local first if present, then fallback to .env
if (existsSync(envLocal)) {
  dotenv.config({ path: envLocal, quiet: true });
}
// Also load .env to fill any missing values
if (existsSync(env)) {
  dotenv.config({ path: env, quiet: true });
}
