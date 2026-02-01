<script lang="ts">
import MessageSquarePlus from "@lucide/svelte/icons/message-square-plus";
import MessagesSquare from "@lucide/svelte/icons/messages-square";
import Trash2 from "@lucide/svelte/icons/trash-2";
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
	if (isDigitKey(e.key) && e.key !== "0" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		goto(`/chat/${chats[Number(e.key) - 1]}`);
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<Sidebar.Root side="right">
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
			<Sidebar.Menu>
				{#each chats as chatId, i (chatId)}
					{@const isActive = chatId === page.params.id}
					{@const hasBadge = i < 9 && !isActive}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							class="h-9"
							{isActive}
							onclick={() => goto(`/chat/${chatId}`)}
						>
							<span
								class="w-full {hasBadge
									? 'mask-r-from-60% mask-r-to-75%'
									: 'mask-r-from-70% mask-r-to-85%'}"
							>
								{await getTitle(chatId)}
							</span>
						</Sidebar.MenuButton>

						<Sidebar.MenuAction
							class="top-1/2 -translate-y-1/2 end-1 hover:bg-primary/10"
							onclick={() => deleteChat(chatId)}
							showOnHover
						>
							<div class="rounded-md p-1.75 [&>svg]:size-3.5">
								{#if ctx.isLoading && isActive}
									<Spinner />
								{:else}
									<Trash2 />
								{/if}
							</div>
						</Sidebar.MenuAction>

						{#if hasBadge}
							<Sidebar.MenuBadge
								class="hidden top-1/2 -translate-y-1/2 sm:flex end-1 bg-sidebar group-hover/menu-item:opacity-0"
							>
								<Kbd.Root>{isMac ? "⌘" : "Ctrl"} + {i + 1}</Kbd.Root>
							</Sidebar.MenuBadge>
						{/if}
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.GroupContent>
		<Sidebar.Group />
	</Sidebar.Content>

	<Sidebar.Footer />
</Sidebar.Root>
