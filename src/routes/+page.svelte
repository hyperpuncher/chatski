<script lang="ts">
import { Chat } from "@ai-sdk/svelte";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Bot from "@lucide/svelte/icons/bot";
import Paperclip from "@lucide/svelte/icons/paperclip";
import { slide } from "svelte/transition";
import { buttonVariants } from "$lib/components/ui/button/index.js";
import * as Command from "$lib/components/ui/command/index.js";
import * as InputGroup from "$lib/components/ui/input-group";
import * as Popover from "$lib/components/ui/popover/index.js";
import { getModels } from "$lib/remote/openrouter.remote";
import { cn } from "$lib/utils";

let input = $state("");
const chat = new Chat({});

let selectedModel = $state("google/gemini-2.5-flash-lite-preview-09-2025");
let isModelsPopoverOpen = $state(false);

function handleSubmit() {
	chat.sendMessage({ text: input, metadata: { model: selectedModel } });
	input = "";
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
		e.preventDefault();
		isModelsPopoverOpen = !isModelsPopoverOpen;
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col justify-center items-center mx-auto max-w-3xl h-full">
	{#if chat.messages.length}
		<ul class="mt-20 mb-12 space-y-8 w-full h-full text-lg" transition:slide>
			{#each chat.messages as message, messageIndex (messageIndex)}
				<li class="w-full">
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === "text"}
							<p
								class={message.role === "user"
									? "ms-auto w-fit rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
									: "leading-7.5"}
							>
								{part.text}
							</p>
						{/if}
					{/each}
				</li>
			{/each}
		</ul>
	{/if}

	<form
		class="sticky bottom-4 w-full"
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<InputGroup.Root
			class="py-1 px-2 rounded-3xl bg-muted/85 backdrop-blur-md dark:bg-muted/85"
		>
			<InputGroup.Textarea
				bind:value={input}
				class="md:text-lg"
				placeholder="Generate slop..."
				onkeydown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						handleSubmit();
					}
				}}
			/>

			<InputGroup.Addon align="block-end">
				<InputGroup.Button variant="ghost" class="rounded-full" size="icon-sm">
					<Paperclip />
				</InputGroup.Button>

				<Popover.Root bind:open={isModelsPopoverOpen}>
					<Popover.Trigger
						class={cn(
							buttonVariants({
								variant: "outline",
								size: "sm",
							}),
							"ms-auto text-xs text-foreground",
						)}
					>
						<Bot />
						{#if selectedModel}
							{selectedModel}
						{:else}
							Select model
						{/if}
					</Popover.Trigger>
					<Popover.Content class="p-0 w-90" side="top" align="end">
						<Command.Root>
							<Command.Input placeholder="Search models..." />
							<Command.List>
								<Command.Empty>No results found.</Command.Empty>
								<Command.Group>
									{#each await getModels() as model}
										<Command.Item
											value={model}
											onSelect={() => {
												selectedModel = model;
												isModelsPopoverOpen = false;
											}}
										>
											<span> {model} </span>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>

				<InputGroup.Button
					variant="default"
					class="rounded-full"
					size="icon-sm"
					type="submit"
					disabled={!input.trim() && !selectedModel}
				>
					<ArrowUp />
				</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
	</form>
</div>
