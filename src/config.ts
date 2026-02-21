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

  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SkoolConfig>;

    cached = {
      cookies: parsed.cookies ?? "",
      defaultCommunity: parsed.defaultCommunity ?? "",
      baseUrl: parsed.baseUrl ?? "https://www.skool.com",
    };
    return cached;
  } catch (err) {
    const msg =
      err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT"
        ? `Config file not found at ${CONFIG_PATH}. Create it with: { "cookies": "...", "defaultCommunity": "...", "baseUrl": "https://www.skool.com" }`
        : `Failed to read config: ${err}`;
    throw new Error(msg);
  }
}
