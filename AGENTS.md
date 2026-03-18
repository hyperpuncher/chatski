# AGENTS.md

## Commands

```sh
bun run check          # type checking
bun run format         # format
bun run lint           # lint
```

## Architecture

- **Electron** — SvelteKit renderer + Node.js main process
- **IPC** via `window.api.*` (defined in `electron/preload.ts`)
- **AI SDK** + OpenRouter for LLM calls
- **Storage**: JSONL files + JSON config in `app.getPath('userData')`
- **Cache**: JSON files in `app.getPath('cache')`
