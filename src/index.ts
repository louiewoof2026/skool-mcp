#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { requestTool } from "./tools/request.js";
import { communityInfoTool, communityLabelsTool } from "./tools/community.js";
import { membersListTool, membersPendingTool, membersApproveTool, membersRejectTool } from "./tools/members.js";
import { postsListTool, postsGetTool, postsCreateTool, postsCommentTool } from "./tools/posts.js";
import { coursesListTool, lessonsListTool } from "./tools/classroom.js";
import { notificationsTool } from "./tools/notifications.js";

// Start the server
function setupServer() {
  const server = new McpServer({
    name: "skool-mcp",
    version: "0.1.0",
  });

  // Discovery
  server.tool(
    requestTool.name,
    requestTool.description,
    requestTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await requestTool.handler(args) }] }),
  );

  // Community
  server.tool(
    communityInfoTool.name,
    communityInfoTool.description,
    communityInfoTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await communityInfoTool.handler(args) }] }),
  );

  server.tool(
    communityLabelsTool.name,
    communityLabelsTool.description,
    communityLabelsTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await communityLabelsTool.handler(args) }] }),
  );

  // Members
  server.tool(
    membersListTool.name,
    membersListTool.description,
    membersListTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await membersListTool.handler(args) }] }),
  );

  server.tool(
    membersPendingTool.name,
    membersPendingTool.description,
    membersPendingTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await membersPendingTool.handler(args) }] }),
  );

  server.tool(
    membersApproveTool.name,
    membersApproveTool.description,
    membersApproveTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await membersApproveTool.handler(args) }] }),
  );

  server.tool(
    membersRejectTool.name,
    membersRejectTool.description,
    membersRejectTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await membersRejectTool.handler(args) }] }),
  );

  // Posts
  server.tool(
    postsListTool.name,
    postsListTool.description,
    postsListTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await postsListTool.handler(args) }] }),
  );

  server.tool(
    postsGetTool.name,
    postsGetTool.description,
    postsGetTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await postsGetTool.handler(args) }] }),
  );

  server.tool(
    postsCreateTool.name,
    postsCreateTool.description,
    postsCreateTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await postsCreateTool.handler(args) }] }),
  );

  server.tool(
    postsCommentTool.name,
    postsCommentTool.description,
    postsCommentTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await postsCommentTool.handler(args) }] }),
  );

  // Classroom
  server.tool(
    coursesListTool.name,
    coursesListTool.description,
    coursesListTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await coursesListTool.handler(args) }] }),
  );

  server.tool(
    lessonsListTool.name,
    lessonsListTool.description,
    lessonsListTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await lessonsListTool.handler(args) }] }),
  );

  // Notifications
  server.tool(
    notificationsTool.name,
    notificationsTool.description,
    notificationsTool.inputSchema,
    async (args) => ({ content: [{ type: "text", text: await notificationsTool.handler(args) }] }),
  );

  return server;
}

async function main() {
  const args = process.argv.slice(2);
  const isHttp = process.env.PORT !== undefined || args.includes("--http");

  if (isHttp) {
    const express = await import("express");
    const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
    const { randomUUID } = await import("node:crypto");
    
    // We need to determine if a message is an initialization request
    const { isInitializeRequest } = await import("@modelcontextprotocol/sdk/types.js");

    const app = express.default();
    app.use(express.json());

    // Healthcheck endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", version: "0.1.0" });
    });

    const transports = new Map<string, typeof StreamableHTTPServerTransport.prototype>();

    // Main MCP endpoint handler for POST (initialization and messages)
    const mcpPostHandler = async (req: any, res: any) => {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      console.log(`[POST] Request received. Session: ${sessionId || "none"}`);
      console.log(`[POST] Headers:`, req.headers);
      console.log(`[POST] Body:`, JSON.stringify(req.body, null, 2));

      try {
        let transport: typeof StreamableHTTPServerTransport.prototype;

        if (sessionId && transports.has(sessionId)) {
          console.log(`[POST] Found existing transport for session: ${sessionId}`);
          transport = transports.get(sessionId)!;
        } else if (!sessionId && isInitializeRequest(req.body)) {
          console.log(`[POST] Processing new initialization request...`);
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (newSessionId: string) => {
              console.log(`[POST] New session initialized: ${newSessionId}`);
              transports.set(newSessionId, transport);
            },
          });

          transport.onclose = () => {
            const sid = transport.sessionId;
            console.log(`[TRANSPORT CLOSED] Session: ${sid}`);
            if (sid && transports.has(sid)) {
              transports.delete(sid);
            }
          };

          const server = setupServer();
          await server.connect(transport);
          
          console.log(`[POST] Transport connected. Handling request...`);
          await transport.handleRequest(req, res, req.body);
          return;
        } else {
          console.error(`[POST ERROR] Bad Request. Session ID: ${sessionId}, isInit: ${isInitializeRequest(req.body)}`);
          res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: Invalid session" },
            id: null,
          });
          return;
        }

        console.log(`[POST] Handling message on existing transport...`);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("[POST EXCEPTION] Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    };

    app.post("/sse", mcpPostHandler);
    app.post("/mcp", mcpPostHandler); // Also support /mcp alias

    // Main MCP endpoint handler for GET (SSE stream)
    const mcpGetHandler = async (req: any, res: any) => {
      const sessionId = (req.headers["mcp-session-id"] as string) || (req.query.sessionId as string);
      
      console.log(`[GET] Request received. Session: ${sessionId || "none"}`);
      console.log(`[GET] Headers:`, req.headers);

      if (!sessionId || !transports.has(sessionId)) {
        console.error(`[GET ERROR] Invalid or missing session ID: ${sessionId}`);
        res.status(400).send("Invalid or missing session ID");
        return;
      }

      console.log(`[GET] Establishing SSE stream for session: ${sessionId}`);
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res);
    };

    app.get("/sse", mcpGetHandler);
    app.get("/mcp", mcpGetHandler); // Also support /mcp alias

    const port = parseInt(process.env.PORT || "3000", 10);
    app.listen(port, () => {
      console.log(`Skool MCP server running on HTTP at http://localhost:${port}/sse (Streamable HTTP)`);
    });
  } else {
    const server = setupServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Skool MCP server running on stdio");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
