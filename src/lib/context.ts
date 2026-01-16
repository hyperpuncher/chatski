import type { ScrollState } from "runed";
import { createContext } from "svelte";
import type { MyChat } from "$lib/types";

export type ChatContext = {
	chat: MyChat;
	newChat: () => void;
	loadChat: (id: string) => Promise<void>;
};

export const [getChatContext, setChatContext] = createContext<ChatContext>();

export const [getScrollContext, setScrollContext] = createContext<ScrollState>();
