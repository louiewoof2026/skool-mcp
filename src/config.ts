import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface SkoolConfig {
  cookies: string;
  defaultCommunity: string;
  baseUrl: string;
}

const CONFIG_PATH = join(homedir(), ".config", "skool-mcp", "config.json");

let cached: SkoolConfig | null = null;

export async function loadConfig(): Promise<SkoolConfig> {
  if (cached) return cached;

  let parsed: Partial<SkoolConfig> = {};
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    parsed = JSON.parse(raw);
  } catch (err) {
    // Ignore ENOENT, we might have env vars
    if (!(err instanceof Error) || !("code" in err) || (err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Failed to read config: ${err}`);
    }
  }

  let cookies = process.env.SKOOL_COOKIES ?? parsed.cookies ?? "";
  
  // Defensive normalization if Vault injected with colon/quotes instead of equals
  if (cookies.startsWith('auth_token:"') && cookies.endsWith('"')) {
    cookies = cookies.replace('auth_token:"', 'auth_token=').slice(0, -1);
  }

  const defaultCommunity = process.env.SKOOL_DEFAULT_COMMUNITY ?? parsed.defaultCommunity ?? "";
  const baseUrl = process.env.SKOOL_BASE_URL ?? parsed.baseUrl ?? "https://www.skool.com";

  if (!cookies) {
    throw new Error("Skool cookies not provided. Set SKOOL_COOKIES env var or add it to config.json.");
  }
  if (!defaultCommunity) {
    throw new Error("Skool defaultCommunity not provided. Set SKOOL_DEFAULT_COMMUNITY env var or add it to config.json.");
  }

  cached = { cookies, defaultCommunity, baseUrl };
  return cached;
}
