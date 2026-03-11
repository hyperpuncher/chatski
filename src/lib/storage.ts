import { refreshChats } from "$lib/storage.svelte";
import type { MyUIMessage } from "$lib/types";
import { createStorage } from "unstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";
import localStorageDriver from "unstorage/drivers/localstorage";

const BASE = "chatski";
const CHAT_KEY = "chat";
const TITLE_KEY = "title";
const CACHE_KEY = "cache";

// Typed storage definition
type StorageDefinition = {
	[key: `chat:${string}`]: MyUIMessage[];
	[key: `title:${string}`]: string;
	"cache:openrouter:models": { data: unknown; timestamp: number };
	"cache:openrouter:labs": { data: unknown; timestamp: number };
};

// Config storage (small, sync-capable)
export const localStorage = createStorage({
	driver: localStorageDriver({ base: BASE }),
});

// Chat storage (larger, async) - typed
const idbStorage = createStorage<StorageDefinition>({
	driver: indexedDbDriver({ base: BASE }),
});

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// Chat storage
export async function getChats(): Promise<string[]> {
	const keys = await idbStorage.keys(`${BASE}:${CHAT_KEY}:`);
	return keys
		.map((key) => key.split(":").at(-1))
		.filter((id): id is string => id !== undefined && id.length > 0)
		.sort()
		.reverse();
}

export async function getTitle(chatId: string): Promise<string | null> {
	return idbStorage.get(`${TITLE_KEY}:${chatId}`);
}

export async function getMessages(chatId: string): Promise<MyUIMessage[] | undefined> {
	const messages = await idbStorage.get(`${CHAT_KEY}:${chatId}`);
	return messages ?? undefined;
}

export async function saveChat({
	chatId,
	messages,
}: {
	chatId: string;
	messages: MyUIMessage[];
}): Promise<void> {
	const existingTitle = await idbStorage.get(`${TITLE_KEY}:${chatId}`);

	const saves: Promise<unknown>[] = [idbStorage.set(`${CHAT_KEY}:${chatId}`, messages)];

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

		saves.push(idbStorage.set(`${TITLE_KEY}:${chatId}`, title));
	}

	await Promise.all(saves);
	refreshChats();
}

export async function deleteChat(chatId: string): Promise<void> {
	await Promise.all([
		idbStorage.del(`${CHAT_KEY}:${chatId}`),
		idbStorage.del(`${TITLE_KEY}:${chatId}`),
	]);
	refreshChats();
}

export async function deleteAllChats(): Promise<void> {
	const chatKeys = await idbStorage.keys(`${BASE}:${CHAT_KEY}:`);
	const titleKeys = await idbStorage.keys(`${BASE}:${TITLE_KEY}:`);
	await Promise.all([...chatKeys, ...titleKeys].map((key) => idbStorage.del(key)));
	refreshChats();
}

// OpenRouter cache
export async function getCachedModels() {
	const cached = await idbStorage.get(`${CACHE_KEY}:openrouter:models`);
	if (!cached) return null;

	if (Date.now() - cached.timestamp > CACHE_TTL) {
		await idbStorage.del(`${CACHE_KEY}:openrouter:models`);
		return null;
	}
	return cached.data;
}

export async function setCachedModels(data: unknown) {
	await idbStorage.set(`${CACHE_KEY}:openrouter:models`, {
		data,
		timestamp: Date.now(),
	});
}

export async function getCachedLabs() {
	const cached = await idbStorage.get(`${CACHE_KEY}:openrouter:labs`);
	if (!cached) return null;

	if (Date.now() - cached.timestamp > CACHE_TTL) {
		await idbStorage.del(`${CACHE_KEY}:openrouter:labs`);
		return null;
	}
	return cached.data;
}

export async function setCachedLabs(data: unknown) {
	await idbStorage.set(`${CACHE_KEY}:openrouter:labs`, {
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
		return parseModels(cached as any[], labs);
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
		return cached as string[];
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
