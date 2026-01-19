<script lang="ts">
import MessageSquarePlus from "@lucide/svelte/icons/message-square-plus";
import MessagesSquare from "@lucide/svelte/icons/messages-square";
import Trash from "@lucide/svelte/icons/trash";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { Button } from "$lib/components/ui/button";
import * as Kbd from "$lib/components/ui/kbd";
import * as Sidebar from "$lib/components/ui/sidebar";
import { Spinner } from "$lib/components/ui/spinner";
import { getChatContext } from "$lib/context";
import { deleteAllChats, deleteChat, getChats, getTitle } from "$lib/remote/chats.remote";
import { isMac } from "$lib/utils";

const ctx = getChatContext();

const chats = $derived(await getChats());

function isDigitKey(key: string) {
	return /^\d$/.test(key);
}

function handleKeydown(e: KeyboardEvent) {
	if (isDigitKey(e.key) && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		goto(`/chat/${chats[Number(e.key) - 1]}`);
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<Sidebar.Root variant="floating" side="right">
	<Sidebar.Header>
		<h1 class="p-2 font-mono text-xl font-bold">chatski</h1>
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
									{isMac ? "⌘" : "Ctrl"} + O
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
				onclick={() => {
					deleteAllChats();
					ctx.newChat();
					goto("/");
				}}
			>
				Clear
			</Button>
		</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu class="gap-1">
				{#each chats as chatId, i (chatId)}
					{@const isSelected = chatId === page.params.id}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							class="truncate mask-r-from-65% mask-r-to-73% py-5 hover:mask-none
							{isSelected
								? 'bg-violet-100 mask-none shadow-sm hover:bg-violet-100 dark:bg-violet-300 dark:text-primary-foreground dark:hover:text-primary-foreground'
								: ''}"
							onclick={() => goto(`/chat/${chatId}`)}
						>
							{await getTitle(chatId)}
						</Sidebar.MenuButton>

						<Button
							class="absolute end-1 top-1/2 -translate-y-1/2 opacity-0 transition-none group-hover/menu-item:opacity-100 
							{isSelected ? 'dark:text-primary-foreground' : ''}"
							variant="ghost"
							size="icon-sm"
							onclick={() => deleteChat(chatId)}
						>
							{#if ctx.isLoading && isSelected}
								<Spinner />
							{:else}
								<Trash />
							{/if}
						</Button>

						{#if i < 9 && !isSelected}
							<Kbd.Root
								class="hidden absolute top-1/2 tabular-nums -translate-y-1/2 sm:inline-flex end-1 group-hover/menu-item:opacity-0"
							>
								{isMac ? "⌘" : "Ctrl"} + {i + 1}
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
