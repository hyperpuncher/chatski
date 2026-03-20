<script lang="ts">
import { ModeWatcher } from "mode-watcher";
import { dev } from "$app/environment";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import Settings from "$lib/components/settings.svelte";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Toaster } from "$lib/components/ui/sonner/index.js";
import { chat } from "$lib/chat.svelte";
import { config } from "$lib/config.svelte";
import { isMobile } from "$lib/utils";
import "./layout.css";
import "@fontsource-variable/cascadia-code";
import "@fontsource-variable/inter";
import FpsCounter from "$lib/components/fps-counter.svelte";

let { children } = $props();
let isSidebarOpen = $state(false);
</script>

{#if dev}
	<FpsCounter />
{/if}
<ModeWatcher />
<Toaster richColors position="top-center" />

<Sidebar.Provider bind:open={isSidebarOpen}>
	<main class="w-full">
		<header
			class="fixed top-0 right-0 left-0 z-10 flex w-full items-center justify-between p-4"
		>
			{#if config.isInitialized}
				<Settings />
			{/if}
			<Sidebar.Trigger
				variant={isMobile.current ? "secondary" : "ghost"}
				class={isSidebarOpen ? "-translate-x-64" : ""}
			/>
		</header>

		{#if config.isInitialized && chat.current}
			{@render children?.()}
		{/if}
	</main>
	<AppSidebar />
</Sidebar.Provider>
