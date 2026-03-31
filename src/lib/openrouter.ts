import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { config } from "./config.svelte";
import {
	getCachedLabs,
	getCachedModels,
	setCachedLabs,
	setCachedModels,
	getCachedProviders,
	setCachedProviders,
} from "./storage";

export function createOpenRouterClient() {
	return createOpenRouter({
		apiKey: config.settings.apiKey,
		headers: {
			"HTTP-Referer": "https://chatski.app",
			"X-Title": "chatski",
		},
	});
}

// ── OpenRouter Providers API ─────────────────────────────────────

export type OpenRouterProvider = {
	name: string;
	slug: string;
	privacy_policy_url: string | null;
	terms_of_service_url: string | null;
	status_page_url: string | null;
};

export async function getProviders(): Promise<OpenRouterProvider[]> {
	const cached = await getCachedProviders();
	if (cached) {
		return cached;
	}
	const response = await fetch("https://openrouter.ai/api/v1/providers");
	if (!response.ok) {
		throw new Error(`Failed to fetch providers: ${response.statusText}`);
	}
	const data = (await response.json()) as { data: OpenRouterProvider[] };
	const providers = data.data.sort((a, b) => a.slug.localeCompare(b.slug));

	await setCachedProviders(providers);
	return providers;
}

// ── OpenRouter Models API ────────────────────────────────────────

export interface ModelInfo {
	id: string;
	name: string;
	modalities: {
		input: string[];
		output: string[];
	};
	supportedParameters: string[];
	contextLength: number;
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
			contextLength: model.context_length ?? 0,
		}))
		.sort((a, b) => a.id.localeCompare(b.id));
}

function parseLabs(data: any[]): string[] {
	return Array.from(new Set(data.map((model: any) => model.id.split("/")[0]).sort()));
}
