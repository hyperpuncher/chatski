<script lang="ts">
import MessageSquarePlus from "@lucide/svelte/icons/message-square-plus";
import MessagesSquare from "@lucide/svelte/icons/messages-square";
import Trash from "@lucide/svelte/icons/trash";
import { Button } from "$lib/components/ui/button";
import * as Kbd from "$lib/components/ui/kbd";
import * as Sidebar from "$lib/components/ui/sidebar";
import { getChatContext } from "$lib/context";
import { deleteAllChats, deleteChat, getChats, getTitle } from "$lib/remote/chats.remote";

const ctx = getChatContext();

const chats = $derived(await getChats());

function isDigitKey(key: string) {
	return /^\d$/.test(key);
}

function handleKeydown(e: KeyboardEvent) {
	if (isDigitKey(e.key) && e.ctrlKey) {
		e.preventDefault();
		ctx.loadChat(chats[Number(e.key) - 1]);
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<Sidebar.Root variant="floating" side="right">
	<Sidebar.Header>
		<h1 class="p-2 font-mono text-xl font-bold">slop</h1>
	</Sidebar.Header>

	<Sidebar.Content class="px-2">
		<Sidebar.Group />
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={() => ctx.newChat()}>
						{#snippet child({ props })}
							<a href="/" {...props}>
								<MessageSquarePlus />
								<span class="font-semibold">New Chat</span>
								<Kbd.Root class="hidden sm:inline-flex ms-auto">
									Ctrl + O
								</Kbd.Root>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.GroupContent>
		<Sidebar.Group />

		<Sidebar.Group />
		<Sidebar.GroupLabel>
			<MessagesSquare />
			<span class="ml-1">Threads</span>
			<Button
				class="ms-auto"
				variant="ghost"
				size="xs"
				onclick={() => deleteAllChats()}
			>
				Clear
			</Button>
		</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu class="gap-1">
				{#each chats as chatId, i (chatId)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="py-5 truncate">
							{#snippet child({ props })}
								<a href={`/chat/${chatId}`} {...props}>
									<svelte:boundary>
										{@const title = await getTitle(chatId)}
										{#if title?.length > 21}
											{title?.slice(0, 21).trimEnd()}...
										{:else}
											{title}
										{/if}
									</svelte:boundary>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
						<Button
							class="absolute top-1/2 opacity-0 transition-none -translate-y-1/2 end-1 group-hover/menu-item:opacity-100"
							variant="ghost"
							size="icon-sm"
							onclick={() => deleteChat(chatId)}
						>
							<Trash />
						</Button>
						{#if i < 9}
							<Kbd.Root
								class="hidden absolute top-1/2 -translate-y-1/2 sm:inline-flex end-1 group-hover/menu-item:opacity-0"
							>
								Ctrl + {i + 1}
							</Kbd.Root>
						{/if}
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.GroupContent>
		<Sidebar.Group />
	</Sidebar.Content>

	<Sidebar.Footer />
</Sidebar.Root>
