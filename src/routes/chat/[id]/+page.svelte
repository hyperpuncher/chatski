<script lang="ts">
import { Chat } from "@ai-sdk/svelte";
import ChatUi from "$lib/components/chat-ui.svelte";
import { getChat } from "$lib/remote/chats.remote";

let { params } = $props();

const messages = $derived(await getChat(params.id));
$inspect(messages);

const chat = $derived(new Chat({ id: params.id, messages }));
</script>

<ChatUi {chat} />
