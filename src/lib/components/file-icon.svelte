<script lang="ts">
import FileText from "@lucide/svelte/icons/file-text";
import Image from "@lucide/svelte/icons/image";
import Music from "@lucide/svelte/icons/music";
import Video from "@lucide/svelte/icons/video";

let { type } = $props();
</script>

{#if type.startsWith("image")}
	<Image aria-hidden="true" />
{:else if type.startsWith("audio")}
	<Music aria-hidden="true" />
{:else if type.startsWith("video")}
	<Video aria-hidden="true" />
{:else}
	<FileText aria-hidden="true" />
{/if}
