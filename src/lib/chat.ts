import { config } from "$lib/config.svelte";
import { createOpenRouterClient, type OpenRouterMetadata } from "$lib/openrouter";
import { saveChat } from "$lib/storage";
import { shellTool, fetchTool, searchTool, readSkillTool } from "$lib/tools";
import type { MyUIMessage } from "$lib/types";
import { roundToSignificant } from "$lib/utils";
import { Chat } from "@ai-sdk/svelte";
import { DirectChatTransport, ToolLoopAgent, stepCountIs } from "ai";
import type { ChatTransport } from "ai";
import { uuidv7 } from "uuidv7";

function createModel() {
	const openrouter = createOpenRouterClient();
	return openrouter.chat(config.settings.model, {
		reasoning: { effort: config.settings.reasoning },
		provider: { order: ["google-ai-studio", "groq"] },
	});
}

function createChatBase({
	id,
	messages,
	instructions,
}: {
	id?: string;
	messages?: MyUIMessage[];
	instructions?: string;
}) {
	if (!id) id = uuidv7();

	const agent = new ToolLoopAgent({
		model: createModel(),
		instructions,
		tools: {
			fetch: fetchTool,
			search: searchTool,
			shell: shellTool,
			skill: readSkillTool,
		},
		stopWhen: stepCountIs(100),
		prepareCall: async (args) => ({
			...args,
			model: createModel(),
		}),
	});

	let start = 0;
	let tokens = 0;
	let cost = 0;
	let provider = "";

	const transport = new DirectChatTransport({
		agent,
		messageMetadata: ({ part }) => {
			if (part.type === "start") {
				start = performance.now();
			} else if (part.type === "finish-step") {
				const metadata = part.providerMetadata?.openrouter as
					| OpenRouterMetadata
					| undefined;
				if (metadata) {
					tokens += metadata.usage.completionTokens;
					cost += metadata.usage.cost;
					provider = metadata.provider;
				}
			} else if (part.type === "finish") {
				const time = roundToSignificant((performance.now() - start) / 1000);
				const tps = Math.round(tokens / time);
				cost = roundToSignificant(cost);
				return { tokens, time, tps, cost, provider };
			}
			return undefined;
		},
	}) as ChatTransport<MyUIMessage>;

	return new Chat<MyUIMessage>({
		id,
		transport,
		messages,
		onFinish: ({ messages }) => saveChat({ chatId: id, messages }),
	});
}

export async function createChat() {
	let instructions = await window.api.system();
	instructions += "\n\n";
	instructions += await window.api.skills.get();
	return createChatBase({ instructions });
}

export function restoreChat(id: string, messages: MyUIMessage[]) {
	return createChatBase({ id, messages });
}
