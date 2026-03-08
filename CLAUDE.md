# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Use comments sparingly. Only comment complex code.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface; Claude generates JSX files in a virtual file system; a live preview renders the result in the browser.

## Commands

```bash
# First-time setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Lint
npm run lint

# Reset the database
npm run db:reset
```

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, a `MockLanguageModel` is used that returns static component code — useful for testing UI without API costs.

The `JWT_SECRET` env var is used for session signing; defaults to `"development-secret-key"` if unset.

## Architecture

### Request Flow

1. User sends a message in `ChatInterface` (uses Vercel AI SDK `useChat`)
2. `POST /api/chat` receives the conversation + serialized virtual FS nodes
3. The route reconstructs a `VirtualFileSystem`, picks the language model, and calls `streamText` with two tools: `str_replace_editor` and `file_manager`
4. As the stream arrives client-side, tool calls are intercepted by `ChatContext.handleToolCall`, which mutates the `FileSystemContext`
5. `PreviewFrame` watches the file system context and re-renders the preview when files change

### Virtual File System (`src/lib/file-system.ts`)

`VirtualFileSystem` is a pure in-memory tree (no disk I/O). Key methods:
- `createFile`, `updateFile`, `deleteFile`, `rename`
- `replaceInFile` / `insertInFile` — implement the `str_replace_editor` tool semantics
- `serialize()` / `deserializeFromNodes()` — convert to/from a plain `Record<string, FileNode>` for JSON storage in SQLite and transmission to the API

### AI Tools (`src/lib/tools/`)

- `str_replace_editor` — supports `create`, `str_replace`, `insert`, and `view` commands; operates on the VirtualFileSystem instance
- `file_manager` — supports `rename` and `delete`

The system prompt (`src/lib/prompts/generation.tsx`) instructs the model that every project must have `/App.jsx` as the entrypoint, use Tailwind for styling, and use the `@/` alias for local imports.

### Context Providers

Two React contexts wrap the app in `MainContent`:
- `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) — owns the `VirtualFileSystem` instance and exposes CRUD helpers + `handleToolCall`
- `ChatProvider` (`src/lib/contexts/chat-context.tsx`) — owns the Vercel AI SDK `useChat` state; calls `handleToolCall` on every incoming tool call

### Preview (`src/components/preview/PreviewFrame.tsx`)

Uses `@babel/standalone` to transpile JSX on the fly in the browser and renders it in an iframe (or inline). The `@/` import alias is resolved to the virtual file system.

### Authentication

JWT-based, cookie-stored sessions using `jose`. See `src/lib/auth.ts`. Auth is optional — anonymous users can use the app without signing in, but their work is not persisted (tracked via `src/lib/anon-work-tracker.ts`).

### Data Model

The database schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the structure of data stored in the database. The Prisma client is generated to `src/generated/prisma`.

`Project` stores both `messages` (full chat history as JSON string) and `data` (serialized virtual FS as JSON string) in SQLite via Prisma.

### Language Model Selection (`src/lib/provider.ts`)

- With `ANTHROPIC_API_KEY`: uses `claude-haiku-4-5` via `@ai-sdk/anthropic`
- Without key: falls back to `MockLanguageModel`, which generates static Counter/Form/Card components based on keywords in the prompt
