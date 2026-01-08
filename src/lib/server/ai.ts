import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_KEY,
	headers: {
		"HTTP-Referer": "http://localhost",
		"X-Title": "chat",
	},
});
