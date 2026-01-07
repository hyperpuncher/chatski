import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { model } from "$lib/server/ai";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const { messages }: { messages: UIMessage[] } = await request.json();

	const result = streamText({
		model: model,
		messages: await convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse();
};
