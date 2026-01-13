import type { Chat } from "@ai-sdk/svelte";
import type { ScrollState } from "runed";
import { createContext } from "svelte";

export type ChatContext = {
	chat: Chat;
	newChat: () => void;
	loadChat: (id: string) => Promise<void>;
};

export const [getChatContext, setChatContext] = createContext<ChatContext>();

export const [getScrollContext, setScrollContext] = createContext<ScrollState>();
