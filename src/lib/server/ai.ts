import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_KEY,
	headers: {
		"HTTP-Referer": "http://localhost",
		"X-Title": "chat",
	},
});

export const model = openrouter.chat("google/gemini-2.5-flash-lite-preview-09-2025", {
	reasoning: { effort: "low", enabled: false },
	provider: { order: ["google-ai-studio"] },
});
