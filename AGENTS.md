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

# Generate types and sync SvelteKit
bun run prepare

# Type checking
bun run check

# Format code (Prettier + Biome + Rustywind)
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

### Component Structure

```svelte
<script lang="ts" module>
// Module-level imports and types
</script>

<script lang="ts">
// Instance-level state and props
let { class: className, ...rest } = $props();
</script>

<markup>
	<!-- Template -->
</markup>

<style>
/* Rarely used - prefer Tailwind */
</style>
```

### Styling

- Use TailwindCSS utility classes
- Use tailwind-variants (tv) for component variants
- Merge classes with `cn()` utility: `cn(baseClass, conditionalClass)`
- shadcn-svelte component patterns with `data-slot` attributes

### Imports

- Use path aliases: `$lib`, `$lib/components/ui`, `$lib/hooks`
- Create barrel files (index.ts) for re-exports
- Named exports for components: `export { ComponentName }`
- Server-only modules in `$lib/server/`

### TypeScript

- Strict mode enabled in tsconfig.json
- Explicit types for component props and function parameters
- Use `WithElementRef<T>` type for components with refs
- Zod for runtime validation: `import * as z from "zod/v4"`

### Naming Conventions

- Components: PascalCase (e.g., `Button.svelte`, `ChatUi.svelte`)
- Functions/variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types: PascalCase with clear suffixes (e.g., `ButtonProps`, `ChatState`)

### Error Handling

- Throw errors with descriptive messages: `throw new Error("message")`
- Use Zod schemas for input validation
- Simple error propagation in remote procedures

### Remote Procedures

- Use `$app/server` for server functions: `query()` and `command()`
- Batch queries with `.batch()` for efficiency
- Call `.refresh()` after mutations to update cached data

## Architecture

### SvelteKit Routing

- Routes in `src/routes/`
- API endpoints: `src/routes/api/[endpoint]/+server.ts`
- Layouts: `+layout.svelte` / `+layout.ts`
- Pages: `+page.svelte`

### State Management

- Svelte 5 runes for local state
- Context API for shared state (e.g., Sidebar)
- $app/state for page-level state
- localStorage for persistent preferences

### AI Integration

- AI SDK + OpenRouter for LLM calls
- Stream responses with `streamText()`
- Save chats to Redis with provider metadata

### Database

- PostgreSQL with Drizzle ORM
- Redis for chat storage and caching
- Connection via environment variables

## Editor Configuration

- Biome: biome.jsonc (formatting, ignores Svelte linter rules)
- Prettier: .prettierrc (plugins for Svelte and Tailwind)
- Path aliases configured in components.json

## Path Aliases

```
$lib          -> src/lib
$lib/components/ui -> src/lib/components/ui
$lib/hooks    -> src/lib/hooks
$lib/utils    -> src/lib/utils
```
