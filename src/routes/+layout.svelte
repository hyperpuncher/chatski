<script lang="ts">
import favicon from "$lib/assets/favicon.svg";
import "./layout.css";
import Settings from "@lucide/svelte/icons/settings";
import { ModeWatcher } from "mode-watcher";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import { Button } from "$lib/components/ui/button";
import * as Sidebar from "$lib/components/ui/sidebar";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
</svelte:head>

<ModeWatcher />

<Sidebar.Provider open={false}>
	<AppSidebar />
	<main class="w-full">
		<header class="flex justify-between items-center p-4">
			<Sidebar.Trigger />

			<Button variant="ghost" size="icon">
				<Settings />
			</Button>
		</header>

		{@render children()}
	</main>
</Sidebar.Provider>
