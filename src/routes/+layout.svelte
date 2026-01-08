<script lang="ts">
import favicon from "$lib/assets/favicon.svg";
import "./layout.css";
import Settings from "@lucide/svelte/icons/settings";
import { ModeWatcher } from "mode-watcher";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import { Button } from "$lib/components/ui/button";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Toaster } from "$lib/components/ui/sonner/index.js";

let { children } = $props();
let isSidebarOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
	<title>chat</title>
</svelte:head>

<ModeWatcher />

<Toaster richColors position="top-center" />

<Sidebar.Provider bind:open={isSidebarOpen}>
	<main class="w-full">
		<header
			class="flex fixed top-0 right-0 left-0 justify-between items-center p-4 w-full"
		>
			<Button variant="ghost" size="icon">
				<Settings />
			</Button>
			<Sidebar.Trigger class={isSidebarOpen ? "-translate-x-64" : ""} />
		</header>

		{@render children()}
	</main>
	<AppSidebar />
</Sidebar.Provider>
