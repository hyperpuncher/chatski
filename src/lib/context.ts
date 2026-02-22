import type { MyChat } from "$lib/types";
import type { ScrollState } from "runed";
import { createContext } from "svelte";

export type ChatContext = {
	chat: MyChat;
	isLoading: boolean;
	newChat: () => void;
	loadChat: (id: string) => Promise<void>;
};

export const [getChatContext, setChatContext] = createContext<ChatContext>();

export const [getScrollContext, setScrollContext] = createContext<ScrollState>();
