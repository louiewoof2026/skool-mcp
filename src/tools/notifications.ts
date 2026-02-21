import { z } from "zod";
import { rawRequest } from "../client.js";
import { loadConfig } from "../config.js";

export const notificationsTool = {
  name: "skool_notifications",
  description:
    "Get recent notifications. Tries the Next.js notifications page data route.",
  inputSchema: {
    page: z.number().default(1).describe("Page number"),
  },
  async handler(args: { page: number }) {
    const config = await loadConfig();

    // Notifications are likely at a user-level route
    const { nextDataRequest } = await import("../client.js");

    try {
      const data = (await nextDataRequest("/notifications", {
        p: String(args.page),
      })) as { pageProps?: Record<string, unknown> };

      const props = data?.pageProps;
      if (!props) throw new Error("No pageProps in response");
      return JSON.stringify(props, null, 2);
    } catch {
      // Fallback: try the www.skool.com route directly
      const result = await rawRequest(
        `${config.baseUrl}/notifications?p=${args.page}`,
        { method: "GET" },
      );

      // Try to parse __NEXT_DATA__ from HTML
      const match = result.body.match(
        /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
      );
      if (match) {
        try {
          const nextData = JSON.parse(match[1]);
          return JSON.stringify(nextData.props?.pageProps ?? nextData, null, 2);
        } catch {
          // fall through
        }
      }

      return `Status: ${result.status}\n\nRaw response (truncated):\n${result.body.slice(0, 3000)}`;
    }
  },
};
