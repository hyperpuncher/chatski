export const chatsStore = $state({
	version: 0,
});

export function refreshChats() {
	chatsStore.version++;
}
