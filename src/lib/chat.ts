import { config } from "$lib/config.svelte";
import { createOpenRouterClient } from "$lib/openrouter";
import { saveChat } from "$lib/storage";
import { shellTool, fetchTool, searchTool, readSkillTool } from "$lib/tools";
import type { MyUIMessage } from "$lib/types";
import { roundToSignificant } from "$lib/utils";
import { Chat } from "@ai-sdk/svelte";
import type { OpenRouterUsageAccounting } from "@openrouter/ai-sdk-provider";
import { DirectChatTransport, ToolLoopAgent, stepCountIs } from "ai";
import type { ChatTransport } from "ai";
import { uuidv7 } from "uuidv7";

function createModel() {
	const openrouter = createOpenRouterClient();
	return openrouter.chat(config.settings.model, {
		reasoning: { effort: config.settings.reasoning },
		provider: {
			order: config.settings.preferredProviders,
			ignore: config.settings.ignoredProviders,
		},
	});
}

function createTools() {
	const tools = {
		...(config.settings.enabledTools.includes("fetch") && { fetch: fetchTool }),
		...(config.settings.enabledTools.includes("search") && { search: searchTool }),
		...(config.settings.enabledTools.includes("shell") && { shell: shellTool }),
		...(config.settings.enabledTools.includes("skill") && { skill: readSkillTool }),
	};
	return tools;
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
		tools: createTools(),
		stopWhen: stepCountIs(100),
		prepareCall: async (args) => ({
			...args,
			model: createModel(),
		}),
	});

	let startTime = 0;
	let totalCost = 0;
	let lastMetadata: { provider: string; usage: OpenRouterUsageAccounting } | undefined;

	const transport = new DirectChatTransport({
		agent,
		messageMetadata: ({ part }) => {
			if (part.type === "start") {
				startTime = performance.now();
				totalCost = 0;
				lastMetadata = undefined;
			} else if (part.type === "finish-step") {
				const metadata = part.providerMetadata?.openrouter as typeof lastMetadata;
				if (metadata) {
					totalCost += metadata.usage.cost ?? 0;
					lastMetadata = metadata;
				}
			} else if (part.type === "finish" && lastMetadata) {
				const time = roundToSignificant((performance.now() - startTime) / 1000);
				const completionTokens = lastMetadata.usage.completionTokens;
				const tps = Math.round(completionTokens / time);
				return {
					promptTokens: lastMetadata.usage.promptTokens,
					completionTokens,
					totalTokens: lastMetadata.usage.totalTokens,
					time,
					tps,
					cost: roundToSignificant(totalCost),
					provider: lastMetadata.provider,
				};
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
