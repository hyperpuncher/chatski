<script lang="ts">
import { Switch as SwitchPrimitive } from "bits-ui";
import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

let {
	ref = $bindable(null),
	class: className,
	checked = $bindable(false),
	...restProps
}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	class={cn(
		"peer inline-flex h-5 w-10 shrink-0 items-center rounded-sm p-0.75 shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
		className,
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			"data-[state=unchecked]:translate-x pointer-events-none block h-full w-3/5 rounded-[0.25rem] bg-background ring-0 transition-transform data-[state=checked]:translate-x-2/3 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
		)}
	/>
</SwitchPrimitive.Root>
