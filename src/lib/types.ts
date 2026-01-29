import type { Chat, UIMessage } from "@ai-sdk/svelte";

type MessageMetadata = {
	tokens: number;
	time: number;
	tps: number;
	cost: number;
	provider: string;
};

export type MyUIMessage = UIMessage<MessageMetadata>;

export type MyChat = Chat<MyUIMessage>;
