<script lang="ts">
import { Chat } from "@ai-sdk/svelte";
import FileText from "@lucide/svelte/icons/file-text";
import Image from "@lucide/svelte/icons/image";
import Music from "@lucide/svelte/icons/music";
import Video from "@lucide/svelte/icons/video";
import * as Kbd from "$lib/components/ui/kbd";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Bot from "@lucide/svelte/icons/bot";
import Clock from "@lucide/svelte/icons/clock";
import Copy from "@lucide/svelte/icons/copy";
import DollarSign from "@lucide/svelte/icons/dollar-sign";
import Gauge from "@lucide/svelte/icons/gauge";
import Lock from "@lucide/svelte/icons/lock";
import LockOpen from "@lucide/svelte/icons/lock-open";
import Paperclip from "@lucide/svelte/icons/paperclip";
import Square from "@lucide/svelte/icons/square";
import Star from "@lucide/svelte/icons/star";
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
let fileList = $state<FileList>();
let defaultModel = $state((await localStorage.get<string>("defaultModel")) ?? "");
let selectedModel = $state(defaultModel);
let favorites = new SvelteSet(await localStorage.get<Set<string>>("favorites"));
let isModelsPopoverOpen = $state(false);
let hoveredModel = $state("");

const models = $derived(await getModels());
const modelsList = $derived([
	...favorites,
	...models.filter((m) => !favorites.has(m.id)).map((m) => m.id),
]);

const modalities = $derived(models.filter((m) => m.id === selectedModel)[0]?.modalities);
const inputModalities = $derived.by(() => {
	let types = [];
	if (modalities.input.includes("image")) {
		types.push("image/*");
	}
	if (modalities.input.includes("audio")) {
		types.push("audio/*");
	}
	if (modalities.input.includes("video")) {
		types.push("video/*");
	}
	if (modalities.input.includes("file")) {
		types.push("application/pdf");
		types.push("text/plain");
	}
	return types.join(",");
});

function handleSubmit() {
	if (chat.status === "streaming") {
		chat.stop();
	} else if (chat.error) {
		toast.error(chat.error.message || "Something went wrong");
	} else {
		chat.sendMessage({
			text: input,
			files: fileList,
			metadata: { model: selectedModel },
		});
	}
	input = "";
	fileList = undefined;
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

function handleFavorite(model: string) {
	if (favorites.has(model)) {
		favorites.delete(model);
	} else {
		favorites.add(model);
	}
	localStorage.set("favorites", [...favorites].sort());
}

function handleDefaultModel(model: string) {
	if (defaultModel === model) {
		defaultModel = "";
		localStorage.remove("defaultModel");
	} else {
		selectedModel = model;
		defaultModel = model;
		localStorage.set("defaultModel", defaultModel);
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col justify-center items-center mx-auto max-w-3xl h-full">
	{#if chat.messages.length}
		<ul class="mt-20 mb-14 space-y-10 w-full h-full" in:slide>
			{#each chat.messages as message, messageIndex (messageIndex)}
				<li class="flex flex-col space-y-2 w-full">
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === "file"}
							<Button variant="outline" size="sm" class="ms-auto">
								{#if part.type.startsWith("image")}
									<Image />
								{:else if part.type.startsWith("audio")}
									<Music />
								{:else if part.type.startsWith("video")}
									<Video />
								{:else}
									<FileText />
								{/if}
								<span>{part.filename}</span>
							</Button>
						{/if}

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
			{#if fileList}
				<InputGroup.Addon align="block-start">
					<ul class="flex gap-2">
						{#each fileList as file}
							<li>
								<Button variant="outline" size="sm">
									{#if file.type.startsWith("image")}
										<Image />
									{:else if file.type.startsWith("audio")}
										<Music />
									{:else if file.type.startsWith("video")}
										<Video />
									{:else}
										<FileText />
									{/if}
									<span>{file.name}</span>
								</Button>
							</li>
						{/each}
					</ul>
				</InputGroup.Addon>
			{/if}

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
				<InputGroup.Button
					variant="outline"
					class="relative rounded-full"
					size="icon-sm"
					disabled={!inputModalities}
				>
					<label class="flex absolute inset-0 justify-center items-center">
						<Paperclip />
						<input
							type="file"
							multiple
							class="hidden"
							accept={inputModalities}
							bind:files={fileList}
						>
					</label>
				</InputGroup.Button>

				<div class="flex gap-2">
					<FileText
						class="size-4 {modalities.input.includes('file')
							? 'text-green-500 dark:text-green-600'
							: ''}"
					/>
					<Image
						class="size-4 {modalities.input.includes('image')
							? 'text-green-500 dark:text-green-600'
							: ''}"
					/>
					<Music
						class="size-4 {modalities.input.includes('audio')
							? 'text-green-500 dark:text-green-600'
							: ''}"
					/>
					<Video
						class="size-4 {modalities.input.includes('video')
							? 'text-green-500 dark:text-green-600'
							: ''}"
					/>
				</div>

				<Popover.Root bind:open={isModelsPopoverOpen}>
					<Popover.Trigger
						class={cn(
							buttonVariants({
								variant: "secondary",
								size: "sm",
							}),
							"ms-auto bg-primary/10 text-xs text-foreground hover:bg-primary/15",
						)}
					>
						<Bot />

						{#if selectedModel}
							{selectedModel.split("/")[1]}
						{:else}
							Select model
						{/if}

						<Kbd.Root>Ctrl + M</Kbd.Root>
					</Popover.Trigger>
					<Popover.Content class="p-0 w-80" side="top" align="end">
						<Command.Root>
							<Command.Input placeholder="Search models..." />
							<Command.List>
								<Command.Empty>No results found.</Command.Empty>
								<Command.Group>
									{#each modelsList as model (model)}
										{@const isFavorite = favorites.has(model)}
										{@const isDefault = defaultModel === model}
										{@const isHovered = hoveredModel === model}
										<Command.Item
											class="flex gap-2 justify-between group"
											value={model}
											onSelect={() => {
												selectedModel = model;
												isModelsPopoverOpen = false;
											}}
											onmouseenter={() => (hoveredModel = model)}
											onmouseleave={() => (hoveredModel = "")}
										>
											<span class="truncate">
												{model.split("/")[1]}
											</span>

											{#if isHovered || isFavorite || isDefault}
												<div class="flex gap-2">
													<Button
														class="invisible transition-none group-hover:visible
														{isDefault ? 'visible' : ''}"
														variant="ghost"
														size="icon-xs"
														onclick={(e) => {
															e.stopPropagation();
															handleDefaultModel(model);
														}}
													>
														{#if isDefault}
															<Lock />
														{:else}
															<LockOpen />
														{/if}
													</Button>
													<Button
														class="invisible transition-none group-hover:visible
														{isFavorite ? 'visible' : ''}"
														variant="ghost"
														size="icon-xs"
														onclick={(e) => {
															e.stopPropagation();
															handleFavorite(model);
														}}
													>
														<Star
															class={isFavorite ? "fill-yellow-400 text-yellow-400" : ""}
														/>
													</Button>
												</div>
											{/if}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>

				<InputGroup.Button
					variant={chat.status === "streaming" ? "destructive" : "default"}
					class="ml-1 rounded-full"
					size="icon-sm"
					type="submit"
					disabled={chat.status !== "streaming" && (!input.trim() || !selectedModel)}
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
