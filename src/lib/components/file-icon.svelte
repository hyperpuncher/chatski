<script lang="ts">
import FileText from "@lucide/svelte/icons/file-text";
import Image from "@lucide/svelte/icons/image";
import Music from "@lucide/svelte/icons/music";
import Video from "@lucide/svelte/icons/video";

let { type } = $props();
</script>

{#if type.startsWith("image")}
	<Image />
{:else if type.startsWith("audio")}
	<Music />
{:else if type.startsWith("video")}
	<Video />
{:else}
	<FileText />
{/if}
