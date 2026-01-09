<script lang="ts">
import PanelRight from "@lucide/svelte/icons/panel-right";
import type { ComponentProps } from "svelte";
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils.js";
import { useSidebar } from "./context.svelte.js";

let {
	ref = $bindable(null),
	class: className,
	onclick,
	...restProps
}: ComponentProps<typeof Button> & {
	onclick?: (e: MouseEvent) => void;
} = $props();

const sidebar = useSidebar();
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon"
	class={cn("duration-200 ease-linear", className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<PanelRight />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
