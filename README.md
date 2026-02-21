# Skool MCP Server

An MCP (Model Context Protocol) server for interacting with Skool.com communities.

## Overview
Skool doesn't have a public API, so this MCP uses authenticated HTTP requests 
to Skool's internal API endpoints (reverse-engineered from the web app).

## Authentication
Uses session cookies from an authenticated Skool session.

## Tools
- `skool.community.list` - List your communities
- `skool.community.get` - Get community details (members, posts, settings)
- `skool.members.list` - List members of a community
- `skool.members.pending` - List pending membership requests
- `skool.members.approve` - Approve a pending member
- `skool.posts.list` - List posts in a community
- `skool.posts.get` - Get a specific post with comments
- `skool.posts.create` - Create a new post
- `skool.posts.comment` - Comment on a post
- `skool.classroom.courses` - List courses
- `skool.classroom.lessons` - List lessons in a course
- `skool.notifications` - Get notifications
