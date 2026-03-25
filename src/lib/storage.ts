import { refreshChats } from "$lib/storage.svelte";
import type { MyUIMessage } from "$lib/types";

import type { OpenRouterProvider } from "./openrouter";

// ── Config storage ──────────────────────────────────────────────
// Thin wrapper: we pass raw JSON strings over IPC to avoid
// double-serialization. The caller (config.svelte.ts) handles
// the JS object ↔ JSON dance.

export const configStorage = {
	async get<T>(key: string): Promise<T | null> {
		const raw = await window.api.config.get();
		if (!raw) return null;
		const obj = JSON.parse(raw);
		return obj[key] ?? null;
	},

	async set<T>(key: string, value: T): Promise<void> {
		const raw = await window.api.config.get();
		const obj = raw ? JSON.parse(raw) : {};
		obj[key] = value;
		await window.api.config.set(JSON.stringify(obj));
	},

	async del(key: string): Promise<void> {
		const raw = await window.api.config.get();
		if (!raw) return;
		const obj = JSON.parse(raw);
		delete obj[key];
		await window.api.config.set(JSON.stringify(obj));
	},
};

// ── Session storage (JSONL) ─────────────────────────────────────
// Each chat is a .jsonl file where every line is a serialized
// UIMessage. We re-write the whole file on save because the AI
// SDK gives us the full message array (handles edits, regens).

function messagesToJSONL(messages: MyUIMessage[]): string {
	return messages.map((m) => JSON.stringify(m)).join("\n") + "\n";
}

function jsonlToMessages(jsonl: string): MyUIMessage[] {
	return jsonl
		.split("\n")
		.filter((line) => line.trim())
		.map((line) => JSON.parse(line));
}

export async function getMessages(chatId: string): Promise<MyUIMessage[] | undefined> {
	const raw = await window.api.sessions.load(chatId);
	if (!raw) return undefined;
	return jsonlToMessages(raw);
}

export async function saveChat({
	chatId,
	messages,
}: {
	chatId: string;
	messages: MyUIMessage[];
}): Promise<void> {
	const jsonl = messagesToJSONL(messages);
	await window.api.sessions.save(chatId, jsonl);
	refreshChats();
}

export async function deleteChat(chatId: string): Promise<void> {
	await window.api.sessions.delete(chatId);
	refreshChats();
}

export async function deleteAllChats(): Promise<void> {
	await window.api.sessions.clear();
	refreshChats();
}

// ── OpenRouter cache ────────────────────────────────────────────
// Stored as separate JSON files in the OS cache directory.
// e.g. ~/.cache/chatski/openrouter-models.json

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

async function getCached<T>(key: string): Promise<T | null> {
	const raw = await window.api.cache.get(key);
	if (!raw) return null;

	const entry = JSON.parse(raw) as CacheEntry<T>;
	if (Date.now() - entry.timestamp > CACHE_TTL) {
		await window.api.cache.del(key);
		return null;
	}
	return entry.data;
}

async function setCached<T>(key: string, data: T): Promise<void> {
	await window.api.cache.set(key, JSON.stringify({ data, timestamp: Date.now() }));
}

export async function getCachedModels(): Promise<unknown[] | null> {
	return getCached<unknown[]>("openrouter-models");
}

export async function setCachedModels(data: unknown[]): Promise<void> {
	await setCached("openrouter-models", data);
}

export async function getCachedLabs(): Promise<string[] | null> {
	return getCached<string[]>("openrouter-labs");
}

export async function setCachedLabs(data: string[]): Promise<void> {
	await setCached("openrouter-labs", data);
}

export async function getCachedProviders(): Promise<OpenRouterProvider[] | null> {
	return getCached<OpenRouterProvider[]>("openrouter-providers");
}

export async function setCachedProviders(data: OpenRouterProvider[]): Promise<void> {
	await setCached("openrouter-providers", data);
}
