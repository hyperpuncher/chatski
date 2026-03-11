<script lang="ts">
import { ModeWatcher, mode } from "mode-watcher";
import { ScrollState } from "runed";
import { tick } from "svelte";
import { dev } from "$app/environment";
import { goto } from "$app/navigation";
import favicon from "$lib/assets/favicon.svg";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import Settings from "$lib/components/settings.svelte";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Toaster } from "$lib/components/ui/sonner/index.js";
import { createChat } from "$lib/chat";
import { config } from "$lib/config.svelte";
import { type ChatContext, setChatContext, setScrollContext } from "$lib/context";
import { getMessages } from "$lib/storage";
import { isMac, isMobile } from "$lib/utils";
import "./layout.css";
import { pwaInfo } from "virtual:pwa-info";
// @ts-expect-error fontsource has no types
import "@fontsource-variable/cascadia-code";
// @ts-expect-error fontsource has no types
import "@fontsource-variable/inter";

let { children } = $props();
let isSidebarOpen = $state(false);

const ctx = $state<ChatContext>({
	chat: createChat(),
	isLoading: false,
	newChat: () => {
		config.settings.selectedModel = config.settings.defaultModel;
		ctx.chat = createChat();
	},
	loadChat: async (id: string) => {
		ctx.isLoading = true;
		const messages = (await getMessages(id)) ?? [];
		ctx.chat = createChat(id, messages);
		await tick();
		ctx.isLoading = false;
		scrollCtx.behavior = "auto";
		scrollCtx.scrollToBottom();
		scrollCtx.behavior = "smooth";
	},
});

const scrollCtx = new ScrollState({
	element: () => document.documentElement,
	behavior: "smooth",
});

setChatContext(ctx);
setScrollContext(scrollCtx);

function handleKeydown(e: KeyboardEvent) {
	if (e.code === "KeyO" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		ctx.newChat();
		goto("/");
	}
}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{dev ? "chatski-dev" : "chatski"}</title>
	<meta name="description" content="chatski with your slop generators" />
	<meta property="og:title" content="chatski" />
	<meta property="og:description" content="chatski with your slop generators" />
	<meta property="og:type" content="website" />
	{#if pwaInfo}
		{@html pwaInfo.webManifest.linkTag}
	{/if}
	<meta name="theme-color" content={mode.current === "dark" ? "#0a0a0a" : "#ffffff"} />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<ModeWatcher />
<Toaster richColors position="top-center" />

<Sidebar.Provider bind:open={isSidebarOpen}>
	<main class="w-full">
		<header
			class="fixed top-0 right-0 left-0 z-10 flex w-full items-center justify-between p-4"
		>
			<Settings />
			<Sidebar.Trigger
				variant={isMobile.current ? "secondary" : "ghost"}
				class={isSidebarOpen ? "-translate-x-64" : ""}
			/>
		</header>

		{#if config.isInitialized}
			{@render children?.()}
		{/if}

		{#if dev}
			<span
				class="fixed top-5 left-15 rounded-full bg-amber-300 px-3 py-1.5 font-mono text-xs text-black"
			>
				DEV
			</span>
		{/if}
	</main>
	<AppSidebar />
</Sidebar.Provider>
