<script lang="ts">
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Bot from "@lucide/svelte/icons/bot";
import Brain from "@lucide/svelte/icons/brain";
import CircleX from "@lucide/svelte/icons/circle-x";
import Clock from "@lucide/svelte/icons/clock";
import Copy from "@lucide/svelte/icons/copy";
import DollarSign from "@lucide/svelte/icons/dollar-sign";
import FileText from "@lucide/svelte/icons/file-text";
import FileUp from "@lucide/svelte/icons/file-up";
import FileX from "@lucide/svelte/icons/file-x";
import Gauge from "@lucide/svelte/icons/gauge";
import Image from "@lucide/svelte/icons/image";
import Lock from "@lucide/svelte/icons/lock";
import LockOpen from "@lucide/svelte/icons/lock-open";
import Music from "@lucide/svelte/icons/music";
import Paperclip from "@lucide/svelte/icons/paperclip";
import Square from "@lucide/svelte/icons/square";
import Star from "@lucide/svelte/icons/star";
import Video from "@lucide/svelte/icons/video";
import WholeWord from "@lucide/svelte/icons/whole-word";
import dracula from "@shikijs/themes/dracula";
import { tick } from "svelte";
import { slide } from "svelte/transition";
import { toast } from "svelte-sonner";
import { Streamdown } from "svelte-streamdown";
import Code from "svelte-streamdown/code";
import { afterNavigate, goto } from "$app/navigation";
import { page } from "$app/state";
import FileIcon from "$lib/components/file-icon.svelte";
import { Button } from "$lib/components/ui/button";
import { buttonVariants } from "$lib/components/ui/button/index.js";
import * as Command from "$lib/components/ui/command/index.js";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import * as InputGroup from "$lib/components/ui/input-group";
import * as Kbd from "$lib/components/ui/kbd";
import * as Popover from "$lib/components/ui/popover/index.js";
import { Spinner } from "$lib/components/ui/spinner";
import { config } from "$lib/config.svelte";
import { getChatContext, getScrollContext } from "$lib/context";
import { getModels } from "$lib/remote/openrouter.remote";
import { cn, collapseFilename, isMac } from "$lib/utils";

const ctx = getChatContext();
const scroll = getScrollContext();

let input = $state("");
let inputElement = $state<HTMLTextAreaElement | null>(null);
let fileList = $state<FileList>();
let hoveredModel = $state("");
let isModelsPopoverOpen = $state(false);
let isResponding = $derived(
	ctx.chat.status !== "error" &&
		ctx.chat.status !== "ready" &&
		ctx.chat.lastMessage?.role !== "assistant",
);
let isStreaming = $derived(ctx.chat.status === "streaming");
let isThinking = $derived(
	ctx.chat.status === "streaming" &&
		ctx.chat.lastMessage?.parts.at(-1)?.type === "reasoning",
);

let isDragging = $state(false);

const favorites = $derived(new Set(config.settings.favorites));
const models = $derived(await getModels(config.settings.labs));
const modelsList = $derived([
	...favorites,
	...models.filter((m) => !favorites.has(m.id)).map((m) => m.id),
]);

const modalities = $derived(
	models.filter((m) => m.id === config.settings.selectedModel)[0]?.modalities,
);
const inputModalities = $derived.by(() => {
	let types = [];
	if (modalities.input.includes("image")) {
		types.push("image/png,image/jpeg,image/webp,image/heic,image/heif");
	}
	if (modalities.input.includes("audio")) {
		types.push(
			"audio/x-aac,audio/flac,audio/mp3,audio/m4a,audio/mpeg,audio/mpga,audio/mp4,audio/ogg,audio/pcm,audio/wav,audio/webm",
		);
	}
	if (modalities.input.includes("video")) {
		types.push(
			"video/x-flv,video/quicktime,video/mpeg,video/mpegs,video/mpg,video/mp4,video/webm,video/wmv,video/3gpp",
		);
	}
	if (modalities.input.includes("file")) {
		types.push("application/pdf,text/plain");
	}
	return types.join(",");
});
const modalityIcons = [
	{ icon: FileText, key: "file" },
	{ icon: Image, key: "image" },
	{ icon: Music, key: "audio" },
	{ icon: Video, key: "video" },
] as const;

const supportedParameters = $derived(
	config.settings.selectedModel &&
		models.find((m) => m.id === config.settings.selectedModel)?.supportedParameters,
);

const reasoningOptions = ["none", "minimal", "low", "medium", "high", "xhigh"];

async function handleSubmit() {
	if (ctx.chat.status === "streaming") {
		ctx.chat.stop();
	} else {
		if (page.url.pathname === "/") {
			await goto(`/chat/${ctx.chat.id}`, { replaceState: true });
		}
		ctx.chat.sendMessage({
			text: input,
			files: fileList,
		});
		await tick();
		scroll.scrollToBottom();
	}
	input = "";
	fileList = undefined;
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "m" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		isModelsPopoverOpen = !isModelsPopoverOpen;
	}
}

function handleCopy(data: string | number) {
	navigator.clipboard.writeText(String(data));
	toast.success("Copied to clipboard");
}

function handlePaste(e: ClipboardEvent) {
	const files = e.clipboardData?.files;
	if (!files?.length) return;

	e.preventDefault();
	const dataTransfer = new DataTransfer();

	for (const file of [...(fileList || []), ...files]) {
		if (!file.type || !inputModalities.includes(file.type)) {
			toast.error("Unsupported file type");
			continue;
		}
		dataTransfer.items.add(file);
	}

	fileList = dataTransfer.files;
}

function handleFavorite(model: string) {
	if (favorites.has(model)) {
		favorites.delete(model);
	} else {
		favorites.add(model);
	}
	config.settings.favorites = [...favorites].sort();
	config.save();
}

function handleDefaultModel(model: string) {
	if (config.settings.defaultModel === model) {
		config.settings.defaultModel = "";
	} else {
		config.settings.selectedModel = model;
		config.settings.defaultModel = model;
	}
	config.save();
}

function handleDrop(e: DragEvent) {
	e.preventDefault();
	e.stopPropagation();
	isDragging = false;

	const dataTransfer = new DataTransfer();

	const files = [...(fileList || []), ...(e.dataTransfer?.files || [])];

	for (const file of files) {
		if (!file.type || !inputModalities.includes(file.type)) {
			toast.error("Unsupported file type");
			continue;
		}
		dataTransfer.items.add(file);
	}

	fileList = dataTransfer.files;
}

function handleRemoveFile(file: File) {
	const dataTransfer = new DataTransfer();
	for (const f of fileList!) {
		if (f !== file) {
			dataTransfer.items.add(f);
		}
	}
	fileList = dataTransfer.files;
}

afterNavigate(() => {
	inputElement?.focus();
});

$effect(() => {
	if (ctx.chat.error) {
		toast.error(ctx.chat.error.message || "Something went wrong");
	}
});
</script>

<svelte:window
	onkeydown={handleKeydown}
	ondragover={(e) => {
		e.preventDefault();
		isDragging = true;
	}}
	ondragleave={() => (isDragging = false)}
	ondrop={handleDrop}
	onpaste={handlePaste}
/>

{#if isDragging}
	<div
		class="flex fixed inset-0 z-10 flex-col gap-4 justify-center items-center bg-black/25 backdrop-blur-sm"
	>
		<div
			class="flex size-[80%] flex-col items-center justify-center gap-4 rounded-2xl border-3 border-dashed text-muted-foreground"
		>
			{#if inputModalities}
				<FileUp class="animate-bounce size-12" />
				<span class="text-lg">Drop files here</span>
			{:else}
				<FileX class="size-12" />
				<span class="text-lg">This model doesn't support file inputs</span>
			{/if}
		</div>
	</div>
{/if}

<div class="flex flex-col justify-center items-center px-2 mx-auto max-w-3xl h-full">
	{#if ctx.chat.messages.length}
		<ul class="px-2 my-20 space-y-10 w-full h-full sm:px-5" in:slide>
			{#each ctx.chat.messages as message, messageIndex (messageIndex)}
				{@const isLastMessage = messageIndex === ctx.chat.messages.length - 1}
				{@const isAssistant = message.role === "assistant"}
				{@const isUser = message.role === "user"}
				<li
					class="flex flex-col space-y-2 w-full"
					class:hidden={isLastMessage && isAssistant && (isResponding || isThinking)}
				>
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === "file"}
							<Button variant="outline" size="sm" class="ms-auto">
								<FileIcon type={part.type} />
								<span>{part.filename}</span>
							</Button>
						{:else if part.type === "text"}
							{#if isUser}
								<p
									class="py-1.5 px-3.5 max-w-full rounded-2xl sm:leading-7 ms-auto w-fit rounded-tr-[3px] bg-primary leading-6.5 text-primary-foreground sm:max-w-5/6"
								>
									{part.text}
								</p>
							{:else}
								<Streamdown
									class="leading-7 sm:leading-7.5"
									content={part.text}
									components={{ code: Code }}
									baseTheme="shadcn"
									animation={{ enabled: isStreaming, type: "fade", duration: 200 }}
									shikiTheme="dracula"
									shikiThemes={{ dracula }}
									theme={{
										code: {
											container: "bg-[#171717]",
											pre: "bg-[#171717] sm:text-base text-primary-foreground dark:text-foreground",
										},
									}}
								/>
							{/if}
						{/if}
					{/each}

					<div
						class:ms-auto={isUser}
						class:hidden={isLastMessage && isStreaming}
						class="flex gap-2 items-center"
					>
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => {
								const text = message.parts.find((p) => p.type === "text")?.text;
								if (text) handleCopy(text);
							}}
						>
							<Copy />
						</Button>

						{#if isAssistant && message.metadata}
							{@const { tokens, cost, tps, time } = message.metadata}
							<div class="text-muted-foreground">
								<Button
									variant="ghost"
									size="xs"
									onclick={() => handleCopy(tokens)}
								>
									<WholeWord />
									{tokens} tokens
								</Button>
								<Button
									variant="ghost"
									size="xs"
									onclick={() => handleCopy(cost)}
								>
									<DollarSign />
									{cost}
								</Button>
								<Button
									variant="ghost"
									size="xs"
									onclick={() => handleCopy(time)}
								>
									<Clock />
									{time}s
								</Button>
								<Button
									variant="ghost"
									size="xs"
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

			<span class="flex items-center h-6 text-muted-foreground">
				{#if isResponding}
					<Spinner />
				{:else if isThinking}
					Thinking...
				{/if}
			</span>
		</ul>
	{/if}

	<form
		class="sticky bottom-2 w-full sm:bottom-4"
		onsubmit={async (e) => {
			e.preventDefault();
			await handleSubmit();
		}}
	>
		<InputGroup.Root
			class="py-1 px-2 rounded-3xl bg-muted/85 backdrop-blur-md dark:bg-muted/85"
		>
			{#if fileList?.length}
				<InputGroup.Addon align="block-start">
					<ul class="flex gap-2">
						{#each fileList as file}
							<li>
								<Button
									variant="outline"
									size="sm"
									class="relative group"
									onclick={() => handleRemoveFile(file)}
								>
									<FileIcon type={file.type} />
									<span>{collapseFilename(file.name)}</span>

									<CircleX
										class="absolute -top-1.5 -right-1.5 md:invisible group-hover:visible size-4.5 text-foreground"
									/>
								</Button>
							</li>
						{/each}
					</ul>
				</InputGroup.Addon>
			{/if}

			<InputGroup.Textarea
				bind:ref={inputElement}
				bind:value={input}
				class="max-h-36 md:text-base"
				autofocus
				placeholder="Generate slop..."
				rows={1}
				onkeydown={async (e) => {
					if (e.key === "Enter" && !e.shiftKey && input.trim()) {
						e.preventDefault();
						await handleSubmit();
					}
				}}
			/>

			<InputGroup.Addon align="block-end">
				{#if config.settings.selectedModel}
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
						{#each modalityIcons as { icon: Icon, key }}
							<Icon
								class="size-4 {modalities.input.includes(key) ? 'text-violet-400' : ''}"
							/>
						{/each}
					</div>
				{/if}

				<div class="flex gap-2 ms-auto">
					{#if supportedParameters?.includes("reasoning")}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="ghost" size="icon-sm">
										<Brain
											class={config.settings.reasoning === "none"
												? ""
												: "text-violet-400"}
										/>
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Group>
									<DropdownMenu.RadioGroup
										bind:value={config.settings.reasoning}
										onValueChange={() => config.save()}
									>
										{#each reasoningOptions as option}
											<DropdownMenu.RadioItem
												class="list-none"
												value={option}
											>
												{option}
											</DropdownMenu.RadioItem>
										{/each}
									</DropdownMenu.RadioGroup>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/if}

					<Popover.Root
						bind:open={isModelsPopoverOpen}
						onOpenChangeComplete={(open) => !open && inputElement?.focus()}
					>
						<Popover.Trigger
							class={cn(
								buttonVariants({
									variant: "secondary",
									size: "sm",
								}),
								"max-w-38 bg-primary/10 text-xs text-foreground hover:bg-primary/15 sm:max-w-full",
							)}
						>
							<Bot />

							{#if config.settings.selectedModel}
								<span class="truncate"
									>{config.settings.selectedModel.split("/")[1]}</span
								>
							{:else}
								<span class="truncate">Select model</span>
							{/if}

							<Kbd.Root class="hidden sm:inline-flex">
								{isMac ? "⌘" : "Ctrl"} + M
							</Kbd.Root>
						</Popover.Trigger>
						<Popover.Content class="p-0 w-66" side="top" align="end">
							<Command.Root>
								<Command.Input placeholder="Search models..." />
								<Command.List>
									<Command.Empty>No results found.</Command.Empty>
									<Command.Group>
										{#each modelsList as model (model)}
											{@const isFavorite = favorites.has(model)}
											{@const isDefault = config.settings.defaultModel === model}
											{@const isHovered = hoveredModel === model}
											<Command.Item
												class="flex gap-2 justify-between group"
												value={model}
												onSelect={() => {
													config.settings.selectedModel = model;
													isModelsPopoverOpen = false;
													config.save();
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
																class={isFavorite
																	? "fill-yellow-400 text-yellow-400"
																	: ""}
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
						variant={ctx.chat.status === "streaming" ? "destructive" : "default"}
						class="ml-1 rounded-full"
						size="icon-sm"
						type="submit"
						disabled={ctx.chat.status !== "streaming" &&
							(!input.trim() || !config.settings.selectedModel)}
					>
						{#if ctx.chat.status === "streaming"}
							<Square />
						{:else}
							<ArrowUp />
						{/if}
					</InputGroup.Button>
				</div>
			</InputGroup.Addon>
		</InputGroup.Root>
	</form>
</div>
