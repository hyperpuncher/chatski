<script lang="ts">
import CircleIcon from "@lucide/svelte/icons/circle";
import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
import { cn, type WithoutChild } from "$lib/utils.js";

let {
	ref = $bindable(null),
	class: className,
	children: childrenProp,
	...restProps
}: WithoutChild<DropdownMenuPrimitive.RadioItemProps> = $props();
</script>

<DropdownMenuPrimitive.RadioItem
	bind:ref
	data-slot="dropdown-menu-radio-item"
	class={cn(
		"relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span
			class="flex absolute justify-center items-center pointer-events-none start-2 size-3.5"
		>
			{#if checked}
				<CircleIcon class="fill-current size-2" />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</DropdownMenuPrimitive.RadioItem>
