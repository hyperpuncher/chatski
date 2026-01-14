import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { RequestHandler } from "@sveltejs/kit";
import {
	convertToModelMessages,
	streamText,
	type UIMessage,
	wrapLanguageModel,
} from "ai";
import { dev } from "$app/environment";
import { saveChat } from "$lib/remote/chats.remote";

type Request = {
	messages: UIMessage[];
	id: string;
	selectedModel: string;
	reasoning: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
};

export const POST: RequestHandler = async ({ request }) => {
	const { messages, id, selectedModel, reasoning }: Request = await request.json();

	const openrouter = createOpenRouter({
		apiKey: request.headers.get("x-api-key") ?? undefined,
		headers: {
			"HTTP-Referer": "https://chatski.app",
			"X-Title": "chatski",
		},
	});

	const model = openrouter.chat(selectedModel, {
		reasoning: { effort: reasoning },
		provider: { order: ["google-ai-studio"] },
	});

	const wrapper = wrapLanguageModel({ model, middleware: devToolsMiddleware() });

	const result = streamText({
		model: dev ? wrapper : model,
		messages: await convertToModelMessages(messages),
	});

	let start = 0;
	return result.toUIMessageStreamResponse({
		messageMetadata: ({ part }) => {
			if (part.type === "start-step") {
				start = performance.now();
			}
			if (part.type === "finish-step") {
				const time = Math.round(((performance.now() - start) / 1000) * 100) / 100;
				const cost = roundToSignificant(
					part.providerMetadata?.openrouter?.usage?.cost,
				);

				return {
					tokens: part.providerMetadata?.openrouter?.usage?.completionTokens,
					tps: Math.round(
						part.providerMetadata?.openrouter?.usage?.completionTokens / time,
					),
					time,
					cost,
				};
			}
		},
		originalMessages: messages,
		onFinish: ({ messages }) => {
			saveChat({ chatId: id, messages });
		},
	});
};

function roundToSignificant(value: number, significantDigits = 3) {
	if (value === 0) return 0;
	const exponent = Math.floor(Math.log10(value));
	const scale = 10 ** (significantDigits - exponent - 1);
	return Math.round(value * scale) / scale;
}
