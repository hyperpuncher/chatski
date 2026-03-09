# AGENTS.md

## Commands

```sh
# Build for production
bun run build

# Generate types and sync SvelteKit
bun run prepare

# Type checking
bun run check
bun run check:watch

# Format code (oxfmt + prettier)
bun run format

# Lint with oxlint
bun run lint
bun run lint:fix

# Clean build artifacts
bun run clean
```

## Architecture

### AI Integration

- AI SDK (@ai-sdk/svelte) + OpenRouter for LLM calls
- Stream responses with `streamText()`
- Chat state managed via `Chat` class from @ai-sdk/svelte
- MCP (Model Context Protocol) support via @ai-sdk/mcp
- Chat persistence to Redis

### Authentication

- Better Auth for authentication
- GitHub OAuth provider
- Server hook validates sessions and allowed emails
- Remote function: `requireAuth()` for protected operations

### Database

- Redis (via Bun's built-in redis) for chat storage and caching
- Keys pattern: `chats:{userId}:{chatId}`, `chat:title:{chatId}`

### Remote Procedures

- Use `$app/server` for server functions: `query()` and `command()`
- Batch queries with `.batch()` for efficiency
- Call `.refresh()` after mutations to update cached data
- Location: `src/lib/remote/*.remote.ts`
