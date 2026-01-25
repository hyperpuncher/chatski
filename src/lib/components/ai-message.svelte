<script lang="ts">
import dracula from "@shikijs/themes/dracula";
import { Streamdown } from "svelte-streamdown";
import Code from "svelte-streamdown/code";

let { content, isStreaming } = $props();
</script>

<Streamdown
	class="leading-7 sm:leading-7.5"
	{content}
	components={{ code: Code }}
	baseTheme="shadcn"
	animation={{ enabled: isStreaming, type: "fade", duration: 200 }}
	shikiTheme="dracula"
	shikiThemes={{ dracula }}
	theme={{
		code: {
			container: "bg-[#171717]",
			pre: "bg-[#171717] sm:text-base text-primary-foreground dark:text-foreground no-scrollbar",
		},
	}}
/>
