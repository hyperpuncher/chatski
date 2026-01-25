import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { RequestHandler } from "@sveltejs/kit";
import { convertToModelMessages, stepCountIs, streamText, wrapLanguageModel } from "ai";
import { dev } from "$app/environment";
import type { MCP } from "$lib/config.svelte";
import type { MyUIMessage } from "$lib/types";

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

	let tools = {};
	const mcpClients: MCPClient[] = [];

	for (const mcp of mcps) {
		if (!mcp.enabled) continue;

		let mcpClient: MCPClient;

		try {
			if (mcp.type === "http") {
				mcpClient = await createMCPClient({
					transport: new StreamableHTTPClientTransport(new URL(mcp.url)),
				});
			} else {
				mcpClient = await createMCPClient({
					transport: new StdioClientTransport({
						command: mcp.command,
						args: mcp.args.split(" "),
					}),
				});
			}
			mcpClients.push(mcpClient);
			tools = { ...tools, ...(await mcpClient.tools()) };
		} catch (e) {
			console.error(e);
		}
	}

	const result = streamText({
		model: dev ? wrapper : model,
		messages: await convertToModelMessages(messages),
		tools,
		stopWhen: stepCountIs(20),
		onFinish: async () => {
			mcpClients.forEach(async (mcpClient) => await mcpClient.close());
		},
	});

	let start = 0;
	return result.toUIMessageStreamResponse({
		messageMetadata: ({ part }) => {
			if (part.type === "start-step") {
				start = performance.now();
			}
			if (part.type === "finish-step") {
				const metadata = part.providerMetadata?.openrouter as OpenRouterMetadata;
				const tokens = metadata.usage.completionTokens;
				const time = roundToSignificant((performance.now() - start) / 1000);
				const tps = Math.round(tokens / time);
				const cost = roundToSignificant(metadata.usage.cost);

				return { tokens, time, tps, cost };
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
