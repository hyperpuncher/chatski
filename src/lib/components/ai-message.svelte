<script lang="ts">
import dracula from "@shikijs/themes/dracula";
import { Streamdown } from "svelte-streamdown";
import Code from "svelte-streamdown/code";

let { content, isStreaming, reasoning = false } = $props();
</script>

<Streamdown
	class="leading-7 sm:leading-7.5 {reasoning ? 'opacity-40 dark:opacity-65' : ''}"
	{content}
	components={{ code: Code }}
	baseTheme="shadcn"
	animation={{ enabled: isStreaming, type: "fade", duration: 350 }}
	shikiTheme="dracula"
	shikiThemes={{ dracula }}
	shikiLanguages={[
		{ id: "astro", import: () => import("@shikijs/langs/astro") },
		{ id: "diff", import: () => import("@shikijs/langs/diff") },
		{ id: "jsonc", import: () => import("@shikijs/langs/jsonc") },
		{ id: "lua", import: () => import("@shikijs/langs/lua") },
		{ id: "powershell", import: () => import("@shikijs/langs/powershell") },
		{ id: "typst", import: () => import("@shikijs/langs/typst") },
	]}
	theme={{
		li: {
			base: "dark:marker:text-muted-foreground",
		},
		code: {
			container: "bg-[#171717]",
			pre: "bg-[#171717] sm:text-base text-primary-foreground dark:text-foreground no-scrollbar selection:bg-neutral-50 selection:text-neutral-950",
		},
	}}
/>
