<script lang="ts">
import { ModeWatcher } from "mode-watcher";
import favicon from "$lib/assets/favicon.svg";
import "../layout.css";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
	<title>chatski</title>
	<meta property="og:title" content="chatski">
	<meta property="og:description" content="Chatski with your slop generators">
	<meta property="og:type" content="website">
</svelte:head>

<ModeWatcher />

<main class="flex justify-center items-center h-dvh">{@render children()}</main>
