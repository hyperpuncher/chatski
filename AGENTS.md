# AGENTS.md

## Commands

```sh
bun run build

# Generate types and sync SvelteKit
bun run prepare

# Type checking
bun run check

bun run format

bun run lint
bun run lint:fix

bun run clean
```

## Architecture

### AI Integration

- AI SDK (@ai-sdk/svelte) + OpenRouter for LLM calls
- Stream responses with `streamText()`
- Chat state managed via `Chat` class from @ai-sdk/svelte
- Chat persistence to IndexedDB

### Database

- Local storage for settings
- IndexedDB for chats and messages
