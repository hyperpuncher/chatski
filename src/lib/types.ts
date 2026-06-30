import type { MyTools } from "$lib/tools";
import type { Chat, UIMessage } from "@ai-sdk/svelte";
import type { InferUITools, UIDataTypes } from "ai";

type MyUITools = InferUITools<MyTools>;

type MessageMetadata = {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	time: number;
	tps: number;
	cost: number;
	provider: string;
};

export type MyUIMessage = UIMessage<MessageMetadata, UIDataTypes, MyUITools>;

export type MyChat = Chat<MyUIMessage>;
