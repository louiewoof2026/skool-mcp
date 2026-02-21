#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { requestTool } from "./tools/request.js";
import { communityInfoTool, communityLabelsTool } from "./tools/community.js";
import { membersListTool, membersPendingTool, membersApproveTool, membersRejectTool } from "./tools/members.js";
import { postsListTool, postsGetTool, postsCreateTool, postsCommentTool } from "./tools/posts.js";
import { coursesListTool, lessonsListTool } from "./tools/classroom.js";
import { notificationsTool } from "./tools/notifications.js";

const server = new McpServer({
  name: "skool-mcp",
  version: "0.1.0",
});

// Register all tools using the MCP SDK pattern: server.tool(name, description, schema, handler)

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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skool MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
