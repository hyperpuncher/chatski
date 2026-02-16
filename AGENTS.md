# AGENTS.md

This document provides guidelines for agents working on this codebase.

## Build Commands

```bash
# Development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Start production server
bun run start

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

Note: This project has no test suite.

## Code Style Guidelines

### Formatting

- Use tabs for indentation (configured in .prettierrc)
- Line width: 90 characters
- Indent width: 4 spaces
- Format command: `bun run format`

### Svelte 5 Patterns

- Use runes syntax: `$state()`, `$derived()`, `$derived.by()`, `$props()`
- Components receive props via destructuring: `let { prop } = $props()`
- Render children with `{@render children?.()}`
- Use `$bindable()` for two-way binding
- Use `bind:this` for element references
- Module-level script: `<script lang="ts" module>` for shared types/exports

### Component Structure

```svelte
<script lang="ts" module>
// Module-level imports, types, and exports
</script>

<script lang="ts">
// Instance-level state and props
let { class: className, variant = "default", children, ...rest } = $props();
</script>

<markup>
	<!-- Template -->
</markup>

<style>
/* Rarely used - prefer Tailwind */
</style>
```

### Styling

- Use TailwindCSS v4 utility classes
- Use tailwind-variants (tv) for component variants
- Merge classes with `cn()` utility: `cn(baseClass, conditionalClass)`
- shadcn-svelte component patterns with `data-slot` attributes
- Tailwind stylesheet: `src/routes/layout.css`

### Imports

- Use path aliases:
    - `$lib` → src/lib
    - `$lib/components/ui` → src/lib/components/ui
    - `$lib/hooks` → src/lib/hooks
- Create barrel files (index.ts) for re-exports
- Named exports for components: `export { ComponentName }`
- Server-only modules in `$lib/server/`

### TypeScript

- Strict mode enabled in tsconfig.json
- Explicit types for component props and function parameters
- Use `WithElementRef<T>` type for components with refs
- Valibot for runtime validation: `import * as v from "valibot"`
- Use `rewriteRelativeImportExtensions: true` for `.js` imports

### Naming Conventions

- Components: PascalCase (e.g., `Button.svelte`, `ChatUi.svelte`)
- Functions/variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types: PascalCase with clear suffixes (e.g., `ButtonProps`, `ChatState`)

### Error Handling

- Throw errors with descriptive messages: `throw new Error("message")`
- Use Valibot schemas for input validation
- Simple error propagation in remote procedures

## Architecture

### SvelteKit Routing

- Routes in `src/routes/`
- API endpoints: `src/routes/api/[endpoint]/+server.ts`
- Layouts: `+layout.svelte` / `+layout.ts`
- Pages: `+page.svelte`
- Route groups: `(app)/`, `(auth)/`

### State Management

- Svelte 5 runes for local state
- Context API for shared state (createContext from svelte)
- localStorage via `$lib/storage.ts` for persistent preferences
- Config store: `$lib/config.svelte.ts`

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

### Environment Variables

Required in `.envrc` or environment:

- `OPENROUTER_API_KEY` - OpenRouter API access
- `AUTH_SECRET` - Better Auth secret
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` - GitHub OAuth
- `AUTH_ALLOWED_EMAILS` - Comma-separated allowed emails
- `REDIS_URL` - Redis connection string

## Editor Configuration

- Prettier: .prettierrc (plugins for Svelte and Tailwind)
- oxfmt for formatting
- oxlint for linting
- Path aliases configured in components.json

## Path Aliases

```
$lib               -> src/lib
$lib/components/ui -> src/lib/components/ui
$lib/hooks         -> src/lib/hooks
$app/server        -> SvelteKit server modules
$env/dynamic/private -> Private environment variables
```

## Key Dependencies

- **Framework**: Svelte 5.49.1, SvelteKit 2.51.0
- **Styling**: TailwindCSS 4.1.17, tailwind-variants, tailwind-merge
- **AI**: ai SDK 6.0.86, @ai-sdk/svelte, @openrouter/ai-sdk-provider
- **Auth**: better-auth 1.5.0-beta.13
- **UI**: bits-ui 2.15.5 (shadcn-svelte base), @lucide/svelte
- **Utils**: valibot, uuidv7, runed, mode-watcher
