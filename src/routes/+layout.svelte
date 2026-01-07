<script lang="ts">
import favicon from "$lib/assets/favicon.svg";
import "./layout.css";
import { ModeWatcher } from "mode-watcher";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
</svelte:head>

<ModeWatcher />

<main class="content-center min-h-dvh bg-background">{@render children()}</main>
