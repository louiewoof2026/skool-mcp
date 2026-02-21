# Skool MCP Server — Build Spec

## What to Build
A Model Context Protocol (MCP) server that provides tools for interacting with Skool.com communities. Since Skool has no public API, we'll reverse-engineer their internal API by intercepting network requests from the web app.

## Tech Stack
- **Runtime:** Node.js (TypeScript)
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **HTTP Client:** `node-fetch` or built-in `fetch`
- **Transport:** stdio (standard MCP pattern)
- **Auth:** Cookie-based session auth (Skool uses session cookies)

## Architecture

### Authentication
Skool uses cookie-based auth. The MCP server should:
1. Accept cookies via config file (`~/.config/skool-mcp/config.json`)
2. The config file stores: `{ "cookies": "...", "communitySlug": "ai-agent-academy-6994" }`
3. All requests include the cookie header

### Skool's Internal API (what we know)
Skool is a React SPA that makes API calls. Common patterns:
- Base URL: `https://www.skool.com`
- API calls are likely under `/api/` or use GraphQL
- The app uses standard REST or GraphQL patterns
- Community pages: `/{slug}` 
- Pending members: `/{slug}/-/pending`
- Settings: `/{slug}/-/settings`
- Classroom: `/{slug}/classroom`

### Discovery Approach
Since we don't have full API docs, build the server with a **discovery tool** first:
1. Include a `skool.discover` tool that takes a URL path and method, makes the request with auth cookies, and returns the raw response
2. This lets us explore the API interactively
3. Once we discover endpoints, add proper typed tools

## Required Tools

### Community
- `skool.community.info` — Get community details (name, description, member count, settings)

### Members
- `skool.members.list` — List community members (with pagination)
- `skool.members.pending` — List pending membership requests  
- `skool.members.approve` — Approve a pending member by ID
- `skool.members.reject` — Reject a pending member

### Posts
- `skool.posts.list` — List posts (with category filter, pagination)
- `skool.posts.get` — Get a post with comments
- `skool.posts.create` — Create a new post (title, body, category)
- `skool.posts.comment` — Add a comment to a post

### Classroom
- `skool.courses.list` — List courses
- `skool.lessons.list` — List lessons in a course

### Notifications
- `skool.notifications` — Get recent notifications

### Discovery/Debug
- `skool.request` — Make an arbitrary authenticated request to Skool (for API discovery)

## Configuration

Config file: `~/.config/skool-mcp/config.json`
```json
{
  "cookies": "paste session cookies here",
  "defaultCommunity": "ai-agent-academy-6994",
  "baseUrl": "https://www.skool.com"
}
```

## MCP Server Setup

### package.json
```json
{
  "name": "skool-mcp",
  "version": "0.1.0",
  "description": "MCP server for Skool.com communities",
  "main": "dist/index.js",
  "bin": { "skool-mcp": "dist/index.js" },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  }
}
```

### Integration with mcporter
After building, register with:
```bash
mcporter add skool --command "node /mnt/c/projects/skool-mcp/dist/index.js" --transport stdio
```

## Key Considerations
1. **Rate limiting:** Skool may rate-limit. Add delays between requests.
2. **Cookie expiry:** Session cookies expire. The server should return clear errors when auth fails.
3. **Pagination:** Most list endpoints probably use cursor or page-based pagination.
4. **HTML parsing:** Some data might only be available in HTML (not JSON API). Use cheerio if needed for HTML parsing.
5. **Error handling:** Return clear MCP errors for auth failures, not-found, etc.

## Build Order
1. Set up TypeScript + MCP SDK boilerplate
2. Build the `skool.request` discovery tool first
3. Test with real cookies to discover API endpoints
4. Add typed tools one by one as we discover the API
5. Add to mcporter config

## DO NOT
- Do not use Puppeteer/Playwright — this should be pure HTTP
- Do not hardcode cookies — read from config file
- Do not use CommonJS — use ES modules
