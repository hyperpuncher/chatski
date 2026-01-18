<script lang="ts">
import { ModeWatcher } from "mode-watcher";
import favicon from "$lib/assets/favicon.svg";
import "./layout.css";
import { pwaInfo } from "virtual:pwa-info";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
	<title>chatski</title>
	<meta name="description" content="chatski with your slop generators">
	<meta property="og:title" content="chatski">
	<meta property="og:description" content="chatski with your slop generators">
	<meta property="og:type" content="website">
	{#if pwaInfo}
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

<ModeWatcher />

{@render children?.()}
