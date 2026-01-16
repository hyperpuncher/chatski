<script lang="ts">
import { untrack } from "svelte";
import ChatUi from "$lib/components/chat-ui.svelte";
import { getChatContext } from "$lib/context.js";

let { params } = $props();

const ctx = getChatContext();

$effect(() => {
	if (untrack(() => ctx.chat.id) !== params.id) {
		ctx.loadChat(params.id);
	}
});
</script>

<ChatUi />
