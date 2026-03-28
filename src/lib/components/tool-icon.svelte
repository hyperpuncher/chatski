<script lang="ts">
import FilePlus from "@lucide/svelte/icons/file-plus";
import Globe from "@lucide/svelte/icons/globe";
import Hammer from "@lucide/svelte/icons/hammer";
import SquareTerminal from "@lucide/svelte/icons/square-terminal";

let { toolName, size = "4" } = $$props;
</script>

{#if toolName === "shell"}
	<SquareTerminal class="size-{size}" />
{:else if toolName === "fetch" || toolName === "search"}
	<Globe class="size-{size}" />
{:else if toolName === "skill"}
	<FilePlus class="size-{size}" />
{:else}
	<Hammer class="size-{size}" />
{/if}
