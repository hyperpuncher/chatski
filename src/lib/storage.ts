import { refreshChats } from "$lib/storage.svelte";
import type { MyUIMessage } from "$lib/types";
import { createStorage } from "unstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";
import localStorageDriver from "unstorage/drivers/localstorage";

const CHAT_KEY = "chat";
const TITLE_KEY = "title";
const CACHE_KEY = "cache";

// Config storage (settings, api key, etc.) - localStorage for speed
export const configStorage = createStorage({
	driver: localStorageDriver({ base: "chatski" }),
});

// Chat storage (messages, titles)
const chatStorage = createStorage({
	driver: indexedDbDriver({
		dbName: "chatski-chats",
		storeName: "data",
	}),
});

// Cache storage (models, labs - ephemeral)
const cacheStorage = createStorage({
	driver: indexedDbDriver({
		dbName: "chatski-cache",
		storeName: "data",
	}),
});

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export async function getChats(): Promise<string[]> {
	const keys = await chatStorage.keys(CHAT_KEY);
	return keys
		.map((key) => key.split(":")[1])
		.sort()
		.reverse();
}

export async function getTitle(chatId: string): Promise<string | null> {
	return chatStorage.get<string>(`${TITLE_KEY}:${chatId}`);
}

export async function getMessages(chatId: string): Promise<MyUIMessage[] | undefined> {
	const messages = await chatStorage.get<MyUIMessage[]>(`${CHAT_KEY}:${chatId}`);
	return messages ?? undefined;
}

export async function saveChat({
	chatId,
	messages,
}: {
	chatId: string;
	messages: MyUIMessage[];
}): Promise<void> {
	const existingTitle = await chatStorage.get<string>(`${TITLE_KEY}:${chatId}`);

	const saves: Promise<unknown>[] = [
		chatStorage.set(`${CHAT_KEY}:${chatId}`, messages),
	];

	if (!existingTitle) {
		const text = messages
			.at(0)
			?.parts.find((p) => p.type === "text")
			?.text.slice(0, 60)
			.trim();

		const filePart = messages.at(0)?.parts.find((p) => p.type === "file");

		let title: string;
		if (text) {
			title = text;
		} else if (filePart?.mediaType) {
			if (filePart.mediaType.startsWith("image/")) title = "image";
			else if (filePart.mediaType.startsWith("audio/")) title = "audio";
			else if (filePart.mediaType.startsWith("video/")) title = "video";
			else if (filePart.mediaType === "application/pdf") title = "pdf";
			else title = "file";
		} else if (filePart) {
			title = "file";
		} else {
			title = "new chat";
		}

		saves.push(chatStorage.set(`${TITLE_KEY}:${chatId}`, title));
	}

	await Promise.all(saves);
	refreshChats();
}

export async function deleteChat(chatId: string): Promise<void> {
	await Promise.all([
		chatStorage.del(`${CHAT_KEY}:${chatId}`),
		chatStorage.del(`${TITLE_KEY}:${chatId}`),
	]);
	refreshChats();
}

export async function deleteAllChats(): Promise<void> {
	await chatStorage.clear();
	refreshChats();
}

// OpenRouter cache
interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export async function getCachedModels(): Promise<unknown[] | null> {
	const cached = await cacheStorage.get<CacheEntry<unknown[]>>(
		`${CACHE_KEY}:openrouter:models`,
	);
	if (!cached) return null;

	if (Date.now() - cached.timestamp > CACHE_TTL) {
		await cacheStorage.del(`${CACHE_KEY}:openrouter:models`);
		return null;
	}
	return cached.data;
}

export async function setCachedModels(data: unknown[]): Promise<void> {
	await cacheStorage.set(`${CACHE_KEY}:openrouter:models`, {
		data,
		timestamp: Date.now(),
	});
}

export async function getCachedLabs(): Promise<string[] | null> {
	const cached = await cacheStorage.get<CacheEntry<string[]>>(
		`${CACHE_KEY}:openrouter:labs`,
	);
	if (!cached) return null;

	if (Date.now() - cached.timestamp > CACHE_TTL) {
		await cacheStorage.del(`${CACHE_KEY}:openrouter:labs`);
		return null;
	}
	return cached.data;
}

export async function setCachedLabs(data: string[]): Promise<void> {
	await cacheStorage.set(`${CACHE_KEY}:openrouter:labs`, {
		data,
		timestamp: Date.now(),
	});
}

// OpenRouter API client
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
