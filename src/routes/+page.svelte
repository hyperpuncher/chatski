<script lang="ts">
import { Chat } from "@ai-sdk/svelte";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Bot from "@lucide/svelte/icons/bot";
import Clock from "@lucide/svelte/icons/clock";
import Copy from "@lucide/svelte/icons/copy";
import DollarSign from "@lucide/svelte/icons/dollar-sign";
import Gauge from "@lucide/svelte/icons/gauge";
import Paperclip from "@lucide/svelte/icons/paperclip";
import Square from "@lucide/svelte/icons/square";
import WholeWord from "@lucide/svelte/icons/whole-word";
import { SvelteSet } from "svelte/reactivity";
import { slide } from "svelte/transition";
import { toast } from "svelte-sonner";
import { Button } from "$lib/components/ui/button";
import { buttonVariants } from "$lib/components/ui/button/index.js";
import * as Command from "$lib/components/ui/command/index.js";
import * as InputGroup from "$lib/components/ui/input-group";
import * as Popover from "$lib/components/ui/popover/index.js";
import { getModels } from "$lib/remote/openrouter.remote";
import { marked } from "$lib/renderer";
import { localStorage } from "$lib/storage";
import { cn } from "$lib/utils";

const chat = new Chat({});

let input = $state("");
let selectedModel = $state("google/gemini-2.5-flash-lite-preview-09-2025");
let defaultModel = $state((await localStorage.get<string>("defaultModel")) ?? "");
let favorites = new SvelteSet(await localStorage.get<Set<string>>("favorites"));
let isModelsPopoverOpen = $state(false);



function handleSubmit() {
	if (chat.status === "streaming") {
		chat.stop();
	} else if (chat.error) {
		toast.error(chat.error.message || "Something went wrong");
	} else {
		chat.sendMessage({ text: input, metadata: { model: selectedModel } });
	}
	input = "";
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
		e.preventDefault();
		isModelsPopoverOpen = !isModelsPopoverOpen;
	}
}

function handleCopy(data: string) {
	navigator.clipboard.writeText(data);
	toast.success("Copied to clipboard");
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col justify-center items-center mx-auto max-w-3xl h-full">
	{#if chat.messages.length}
		<ul class="mt-20 mb-14 space-y-10 w-full h-full" in:slide>
			{#each chat.messages as message, messageIndex (messageIndex)}
				<li class="flex flex-col space-y-2 w-full">
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === "text"}
							<p
								class={message.role === "user"
									? "ms-auto w-fit rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
									: "ai leading-7.5"}
							>
								{#if message.role === "user"}
									{part.text}
								{:else}
									{@html marked.parse(part.text)}
								{/if}
							</p>
						{/if}
					{/each}

					<div
						class:ms-auto={message.role === "user"}
						class:hidden={messageIndex === chat.messages.length - 1 &&
							chat.status === "streaming"}
						class="flex gap-2 items-center"
					>
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => handleCopy(message.parts.at(-1)?.text)}
						>
							<Copy />
						</Button>

						{#if message.role === "assistant" && message.metadata}
							{@const { tokens, cost, tps, time } = message.metadata}
							<div class="text-muted-foreground">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleCopy(tokens)}
								>
									<WholeWord />
									{tokens} tokens
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleCopy(cost)}
								>
									<DollarSign />
									{cost} $
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleCopy(time)}
								>
									<Clock />
									{time} s
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleCopy(tps)}
								>
									<Gauge />
									{tps} tokens/s
								</Button>
							</div>
						{/if}
					</div>
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
				class="md:text-base"
				placeholder="Generate slop..."
				onkeydown={(e) => {
					if (e.key === "Enter" && !e.shiftKey && input.trim()) {
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
					variant={chat.status === "streaming" ? "destructive" : "default"}
					class="ml-2 rounded-full"
					size="icon-sm"
					type="submit"
					disabled={!input.trim() || !selectedModel}
				>
					{#if chat.status === "streaming"}
						<Square />
					{:else}
						<ArrowUp />
					{/if}
				</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
	</form>
</div>
