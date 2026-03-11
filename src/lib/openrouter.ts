import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { config } from "./config.svelte";

export function createOpenRouterClient() {
	return createOpenRouter({
		apiKey: config.settings.apiKey,
		headers: {
			"HTTP-Referer": "https://chatski.app",
			"X-Title": "chatski",
		},
	});
}

export type OpenRouterMetadata = {
	usage: {
		promptTokens: number;
		promptTokensDetails: {
			cachedTokens: number;
		};
		completionTokens: number;
		completionTokensDetails: {
			reasoningTokens: number;
		};
		cost: number;
		totalTokens: number;
	};
	provider: string;
};
