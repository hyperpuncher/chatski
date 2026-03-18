<script lang="ts">
import { ModeWatcher, mode } from "mode-watcher";
import { dev } from "$app/environment";
import favicon from "$lib/assets/favicon.svg";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import Settings from "$lib/components/settings.svelte";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Toaster } from "$lib/components/ui/sonner/index.js";
import { config } from "$lib/config.svelte";
import { isMobile } from "$lib/utils";
import "./layout.css";
import "@fontsource-variable/cascadia-code";
import "@fontsource-variable/inter";
import FpsCounter from "$lib/components/fps-counter.svelte";

let { children } = $props();
let isSidebarOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{dev ? "chatski-dev" : "chatski"}</title>
	<meta name="description" content="chatski with your slop generators" />
	<meta property="og:title" content="chatski" />
	<meta property="og:description" content="chatski with your slop generators" />
	<meta property="og:type" content="website" />
	<meta name="theme-color" content={mode.current === "dark" ? "#0a0a0a" : "#ffffff"} />
</svelte:head>

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
			<Settings />
			<Sidebar.Trigger
				variant={isMobile.current ? "secondary" : "ghost"}
				class={isSidebarOpen ? "-translate-x-64" : ""}
			/>
		</header>

		{#if config.isInitialized}
			{@render children?.()}
		{/if}
	</main>
	<AppSidebar />
</Sidebar.Provider>
