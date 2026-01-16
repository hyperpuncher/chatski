<script lang="ts">
import favicon from "$lib/assets/favicon.svg";
import "../layout.css";
import { Chat } from "@ai-sdk/svelte";
import { DefaultChatTransport } from "ai";
import { ModeWatcher } from "mode-watcher";
import { ScrollState } from "runed";
import { tick } from "svelte";
import { uuidv7 } from "uuidv7";
import { dev } from "$app/environment";
import { goto } from "$app/navigation";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import Settings from "$lib/components/settings.svelte";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Toaster } from "$lib/components/ui/sonner/index.js";
import { config } from "$lib/config.svelte";
import { type ChatContext, setChatContext, setScrollContext } from "$lib/context";
import { getMessages } from "$lib/remote/chats.remote";
import { localStorage } from "$lib/storage";
import { isMac, isMobile } from "$lib/utils";

// import eruda from "eruda";

// eruda.init();

let { children } = $props();
let isSidebarOpen = $state(false);

const transport = new DefaultChatTransport({
	headers: async () => ({
		"x-api-key": `${config.apiKey}`,
	}),
	body: async () => ({
		selectedModel: await localStorage.get<string>("selectedModel"),
		reasoning: await localStorage.get<string>("reasoning"),
	}),
});

const ctx = $state<ChatContext>({
	chat: new Chat({ id: uuidv7(), transport }),
	newChat: () => {
		ctx.chat = new Chat({ id: uuidv7(), transport });
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
await config.init();

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "o" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		ctx.newChat();
		goto("/");
	}
}
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
	<title>chatski</title>
	<meta property="og:title" content="chatski">
	<meta property="og:description" content="Chatski with your slop generators">
	<meta property="og:type" content="website">
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<ModeWatcher />

<Toaster richColors position="top-center" />

<Sidebar.Provider bind:open={isSidebarOpen}>
	<main
		class="w-full selection:bg-violet-300 selection:text-foreground dark:selection:text-primary-foreground"
	>
		<header
			class="flex fixed top-0 right-0 left-0 z-10 justify-between items-center p-4 w-full"
		>
			<Settings />
			<Sidebar.Trigger
				variant={isMobile.current ? "secondary" : "ghost"}
				class={isSidebarOpen ? "-translate-x-64" : ""}
			/>
		</header>

		{#if config.isConfigured}
			{@render children()}
		{/if}

		{#if dev}
			<span
				class="fixed top-5 py-1.5 px-3 font-mono text-xs text-black bg-amber-300 rounded-full left-15"
			>
				DEV
			</span>
		{/if}
	</main>
	<AppSidebar />
</Sidebar.Provider>
