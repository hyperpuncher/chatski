<script lang="ts">
import { Chat } from "@ai-sdk/svelte";
import ChatUi from "$lib/components/chat-ui.svelte";

const chat = new Chat({});
</script>

<ChatUi {chat} />
