<script lang="ts">
import ChatUi from "$lib/components/chat-ui.svelte";
import { getChatContext } from "$lib/context";

const ctx = getChatContext();
</script>

<ChatUi chat={ctx.chat} />
