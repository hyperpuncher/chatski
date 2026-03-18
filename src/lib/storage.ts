import { refreshChats } from "$lib/storage.svelte";
import type { MyUIMessage } from "$lib/types";

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

// ── OpenRouter API client ───────────────────────────────────────

interface ModelInfo {
	id: string;
	name: string;
	modalities: {
		input: string[];
		output: string[];
	};
	supportedParameters: string[];
}

export async function getModels(labs: string[]): Promise<ModelInfo[]> {
	const cached = await getCachedModels();
	if (cached) {
		return parseModels(cached, labs);
	}

	const res = await fetch("https://openrouter.ai/api/v1/models");
	const json = await res.json();
	const data = json.data;

	await setCachedModels(data);
	await setCachedLabs(parseLabs(data));

	return parseModels(data, labs);
}

export async function getLabs(): Promise<string[]> {
	const cached = await getCachedLabs();
	if (cached) {
		return cached;
	}

	const res = await fetch("https://openrouter.ai/api/v1/models");
	const json = await res.json();
	const data = json.data;

	await setCachedModels(data);
	const labs = parseLabs(data);
	await setCachedLabs(labs);

	return labs;
}

function parseModels(data: any[], labs: string[]): ModelInfo[] {
	const labsSet = new Set(labs);

	return data
		.filter((model: any) => labsSet.has(model.id.split("/")[0]))
		.map((model: any) => ({
			id: model.id,
			name: model.name,
			modalities: {
				input: model.architecture.input_modalities,
				output: model.architecture.output_modalities,
			},
			supportedParameters: model.supported_parameters,
		}))
		.sort((a, b) => a.id.localeCompare(b.id));
}

function parseLabs(data: any[]): string[] {
	return Array.from(new Set(data.map((model: any) => model.id.split("/")[0]).sort()));
}
