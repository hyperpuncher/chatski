import { createChat, restoreChat } from "$lib/chat";

import { getMessages } from "./storage";
import type { MyChat } from "./types";

class Chat {
	current = $state<MyChat>(undefined!);
	isLoading = $state(true);

	async newChat() {
		this.isLoading = true;
		this.current = await createChat();
		this.isLoading = false;
	}

	async loadChat(id: string) {
		this.isLoading = true;
		const messages = (await getMessages(id)) ?? [];
		this.current = restoreChat(id, messages);
		this.isLoading = false;
	}
}

export const chat = new Chat();
