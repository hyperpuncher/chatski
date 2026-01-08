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

	return result.toUIMessageStreamResponse();
};
