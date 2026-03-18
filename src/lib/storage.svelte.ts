export type ChatEntry = {
	id: string;
	title: string;
};

export const chatsStore = $state<{ chats: ChatEntry[] }>({
	chats: [],
});

export async function refreshChats() {
	chatsStore.chats = await window.api.sessions.titles();
}
