import type { MCP } from "$lib/config.svelte";
import type { MyUIMessage } from "$lib/types";
import type { RequestHandler } from "@sveltejs/kit";

import { dev } from "$app/environment";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, stepCountIs, streamText, wrapLanguageModel } from "ai";

type Request = {
	messages: MyUIMessage[];
	id: string;
	selectedModel: string;
	reasoning: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
	mcps: MCP[];
};

type OpenRouterMetadata = {
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

export const POST: RequestHandler = async ({ request }) => {
	const { messages, selectedModel, reasoning, mcps }: Request = await request.json();

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

	const tools = {};
	const mcpClients: MCPClient[] = [];

	if (!selectedModel.includes("image")) {
		const enabledMCPs = await Promise.all(
			mcps
				.filter((mcp) => mcp.enabled)
				.map(async (mcp) => {
					try {
						const mcpClient = await (mcp.type === "http"
							? createMCPClient({
									transport: { type: "http", url: mcp.url },
								})
							: createMCPClient({
									transport: new Experimental_StdioMCPTransport({
										command: mcp.command,
										args: mcp.args.trim().split(" "),
									}),
								}));
						const tools = await mcpClient.tools();
						return { mcpClient, tools };
					} catch (e) {
						console.error(e);
					}
				}),
		);

		for (const mcp of enabledMCPs) {
			if (!mcp) continue;
			mcpClients.push(mcp.mcpClient);
			Object.assign(tools, mcp.tools);
		}
	}

	const result = streamText({
		model: dev ? wrapper : model,
		messages: await convertToModelMessages(messages),
		tools,
		stopWhen: stepCountIs(10),
		maxRetries: 3,
		onFinish: async () => {
			mcpClients.forEach(async (mcpClient) => await mcpClient.close());
		},
	});

	let start = 0;
	let tokens = 0;
	let cost = 0;
	let provider = "";

	return result.toUIMessageStreamResponse({
		messageMetadata: ({ part }) => {
			if (part.type === "start") {
				start = performance.now();
			} else if (part.type === "finish-step") {
				const metadata = part.providerMetadata?.openrouter as OpenRouterMetadata;
				tokens += metadata.usage.completionTokens;
				cost += metadata.usage.cost;
				provider = metadata.provider;
			} else if (part.type === "finish") {
				const time = roundToSignificant((performance.now() - start) / 1000);
				const tps = Math.round(tokens / time);
				cost = roundToSignificant(cost);

				return { tokens, time, tps, cost, provider };
			}
		},
		originalMessages: messages,
	});
};

function roundToSignificant(value: number, significantDigits = 2) {
	if (value === 0) return 0;
	const exponent = Math.floor(Math.log10(value));
	const scale = 10 ** (significantDigits - exponent - 1);
	return Math.round(value * scale) / scale;
}
