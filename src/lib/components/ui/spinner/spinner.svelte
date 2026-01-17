<script lang="ts">
import Loader from "@lucide/svelte/icons/loader";
import type { ComponentProps } from "svelte";
import { cn } from "$lib/utils.js";

let { class: className, ...restProps }: ComponentProps<typeof Loader> = $props();
</script>

<Loader
	role="status"
	aria-label="Loading"
	class={cn("size-4 animate-spin", className)}
	{...restProps}
/>
