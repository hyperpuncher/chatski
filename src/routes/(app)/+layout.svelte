<script lang="ts">
import favicon from "$lib/assets/favicon.svg";
import "../layout.css";
import { Chat } from "@ai-sdk/svelte";
import { DefaultChatTransport } from "ai";
import { ModeWatcher } from "mode-watcher";
import { ScrollState } from "runed";
import { tick } from "svelte";
import { goto } from "$app/navigation";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import Settings from "$lib/components/settings.svelte";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Toaster } from "$lib/components/ui/sonner/index.js";
import { type ChatContext, setChatContext, setScrollContext } from "$lib/context";
import { getChats, getMessages } from "$lib/remote/chats.remote";
import { localStorage } from "$lib/storage";

// import eruda from "eruda";

// eruda.init();

let { children } = $props();
let isSidebarOpen = $state(false);

const transport = new DefaultChatTransport({
	headers: async () => ({
		"x-api-key": `${await localStorage.get<string>("apiKey")}`,
	}),
	body: async () => ({
		selectedModel: await localStorage.get<string>("selectedModel"),
		reasoning: await localStorage.get<string>("reasoning"),
	}),
});

const ctx = $state<ChatContext>({
	chat: new Chat({ id: crypto.randomUUID(), transport }),
	newChat: () => {
		ctx.chat = new Chat({ id: crypto.randomUUID(), transport });
	},
	loadChat: async (id: string) => {
		const messages = (await getMessages(id)) ?? [];
		ctx.chat = new Chat({ id, messages, transport });
		await tick();
		scrollCtx.scrollToBottom();
	},
});

const scrollCtx = new ScrollState({
	element: () => document.documentElement,
	behavior: "smooth",
});

setChatContext(ctx);
setScrollContext(scrollCtx);

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "o" && (e.ctrlKey || e.metaKey)) {
		e.preventDefault();
		ctx.newChat();
		goto("/");
	}
}
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
	<title>chat</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<ModeWatcher />

<Toaster richColors position="top-center" />

<Sidebar.Provider bind:open={isSidebarOpen}>
	<main class="w-full">
		<header
			class="flex fixed top-0 right-0 left-0 justify-between items-center p-4 w-full"
		>
			<Settings />
			<Sidebar.Trigger class={isSidebarOpen ? "-translate-x-64" : ""} />
		</header>

		{@render children()}
	</main>
	<AppSidebar />
</Sidebar.Provider>
