<script lang="ts">
import { ModeWatcher } from "mode-watcher";
import favicon from "$lib/assets/favicon.svg";
import "./layout.css";
import { pwaInfo } from "virtual:pwa-info";
import { dev } from "$app/environment";
import "@fontsource-variable/cascadia-code";
import "@fontsource-variable/inter";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
	<title>{dev ? "chatski-dev" : "chatski"}</title>
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
