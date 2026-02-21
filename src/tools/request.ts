import { z } from "zod";
import { rawRequest } from "../client.js";

export const requestTool = {
  name: "skool_request",
  description:
    "Make an arbitrary authenticated HTTP request to any Skool URL. Useful for API discovery and debugging. Cookies and User-Agent are injected automatically.",
  inputSchema: {
    url: z.string().describe("Full URL to request (e.g. https://www.skool.com/some/path or https://api2.skool.com/endpoint)"),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET").describe("HTTP method"),
    headers: z.record(z.string()).optional().describe("Additional headers as key-value pairs"),
    body: z.string().optional().describe("Request body (for POST/PUT/PATCH)"),
  },
  async handler(args: { url: string; method: string; headers?: Record<string, string>; body?: string }) {
    const result = await rawRequest(args.url, {
      method: args.method,
      headers: args.headers,
      body: args.body,
    });

    // Try to pretty-print JSON body
    let formattedBody = result.body;
    try {
      formattedBody = JSON.stringify(JSON.parse(result.body), null, 2);
    } catch {
      // leave as-is
    }

    return `HTTP ${result.status}\n\nHeaders:\n${JSON.stringify(result.headers, null, 2)}\n\nBody:\n${formattedBody}`;
  },
};
