import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openrouter } from "$lib/server/ai";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const { messages }: { messages: UIMessage[] } = await request.json();

	const model = openrouter.chat(messages.at(-1)?.metadata?.model, {
		reasoning: { effort: "low", enabled: false },
		provider: { order: ["google-ai-studio"] },
	});

	const result = streamText({
		model: model,
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
	});
};

function roundToSignificant(value: number, significantDigits = 3) {
	if (value === 0) return 0;
	const exponent = Math.floor(Math.log10(Math.abs(value)));
	const scale = 10 ** (significantDigits - exponent - 1);
	return Math.round(value * scale) / scale;
}
